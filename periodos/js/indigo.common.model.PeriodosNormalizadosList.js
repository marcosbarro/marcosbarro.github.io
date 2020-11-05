var indigo = indigo || {};
indigo.common = indigo.common || {};
indigo.common.model = indigo.common.model || {};


indigo.common.model.PeriodosNormalizadosList = function(tsDesde, tsHasta) {
    if (!indigo.common.util.esEntero(tsDesde)) {
        throw "timestamp (time) de inicio del período incorrecta";
    }    
    
    if (!indigo.common.util.esEntero(tsHasta)) {
        throw "fecha y hora de fin del período incorrecta";
    }  
    
    if (!(tsDesde < tsHasta)) {
        throw "período de la lista incorrecto; la fecha de fin tiene que ser posterior a la de inicio";
    }
    
    // se asignan las propiedades de inicio y fin de la lista de períodos y el array interno de períodos
    this.desde = tsDesde;
    this.hasta = tsHasta;
    
    this.periodos = [new indigo.common.model.Periodo(this.desde, this.hasta)];
    
    // función usada para sumar valores de períodos (se puede sobreescribir)
    this.sumarValores = function(v1, v2) {
       if (!v1) return v2;
       if (!v2) return v1;                               
       return v1 + v2;
    }; 

    // función para determinar si dos períodos son iguales (se puede sobreescribir)
    this.valoresIguales = function(v1, v2) {
        return v1 == v2
    };

    // devuelve la duración total de la lista de períodos en milisegundos
    this.getDuracionTotal = function () {
        return this.hasta - this.desde;
    };
    
    // devuelve la duración total de los períodos de la lista con valor asignado
    this.getDuracionPeriodosConValor = function () {
        var periodos = this.periodos;
        var resultado = 0;
        for (var i = 0; i < periodos.length; i++) {
            if (periodos[i].valor) {
                resultado += periodos[i].getDuracion();
            }
        }
        
        return resultado;
    }    
    
    // devuelve la duración total de los períodos de la lista sin valor asignado ( = huecos)
    this.getDuracionPeriodosSinValor = function () {
        var periodos = this.periodos;
        var resultado = 0;
        for (var i = 0; i < periodos.length; i++) {
            if (!periodos[i].valor) {
                resultado += periodos[i].getDuracion();
            }
        }
        
        return resultado;    
    }    
    
    
    
    // devuelve el array de períodos que resulta de unificar los períodos contiguos con el mismo valor en el array de períodos especificado
    // OJO: esta función no funciona si los períodos no son contiguos; si no lo son lanza una excepción.
    this.unificarPeriodosContiguos = function(pa){
        var resultado = [];
        var valoresIguales = this.valoresIguales;
        
        // ordenar los períodos si es necesario
        if (!indigo.common.model.Periodo.ordenado(pa)) {
            pa = pa.sort(indigo.common.model.Periodo.comparador);
        }
        
        // comprobar que todos los períodos del array son contiguos, y si es necesario unificar o no
        var necesarioUnificar = false;
        for (var i=1; i < pa.length; i++){
           if (pa[i-1].hasta != pa[i].desde) {
              throw "no se puede unificar un array con períodos no contiguos";
           }
           
           if (valoresIguales(pa[i-1].valor, pa[i].valor)) {
              necesarioUnificar = true;
           }
        }
        
        // si no es necesario unificar, se devuelve el array de períodos
        if (!necesarioUnificar) {
           return pa;
        }
        
        
        // recorrer los periodos originales
        var pAnterior = pa[0];
        var pActual = null;
        var pNuevo = null;
        for (var i = 1; i < pa.length; i++) {
            pActual = pa[i]; 
            if (!valoresIguales(pAnterior.valor, pActual.valor)) {
                // agregar el período "anterior" con la fecha de fin de inicio del actual                
                pNuevo = new indigo.common.model.Periodo(pAnterior.desde, pActual.desde, pAnterior.valor);
                
                resultado.push(pNuevo); 
                pAnterior = pActual;
            }
        }
        
        // agregar el período pendiente de agregar (el "actual", con la fecha de inicio del "anterior")
        pNuevo = new indigo.common.model.Periodo(pAnterior.desde, pActual.hasta, pActual.valor);
        resultado.push(pNuevo); 
        
        // devolver los períodos unificados
        return resultado;
    };


    // método para agregar un período a la lista de períodos actual 
    this.agregar = function(p) {
        if (!p.valor) { // si el período a agregar no tiene valor, no hay que agregarlo
           return;
        };
        
        // calcular el período a agregar 
        var pdesde = Math.max(this.desde, p.desde);
        var phasta = Math.min(this.hasta, p.hasta);
        if (phasta <= pdesde) { // el período a agregar no entra en el rango de la lista actual => no hay que agregar
           return;
        }
        
        // instanciar el período a agregar
        var pNuevo = new indigo.common.model.Periodo(pdesde, phasta, p.valor);
        
        var solapamientos  = pNuevo.obtenerSolapamientos(this.periodos);
        
        var periodosConflictivos = solapamientos.solapados;
        periodosConflictivos.push(pNuevo);
        
        var periodosArreglados = []; // períodos resultantes de normalizar los conflictivos
        
        var puntosCorte = indigo.common.model.Periodo.obtenerPuntosDeCorte(periodosConflictivos);
        for (var i = 0; i < puntosCorte.length - 1; i++) {
            var np = new indigo.common.model.Periodo(puntosCorte[i], puntosCorte[i+1]);
            
            // obtener los períodos de los que se obtendrán los valores para cálculo del valor del nuevo período
            var periodosCalculo = np.obtenerPeriodosSolapados(periodosConflictivos); // por definición será 1 ó 2
            if (periodosCalculo.length == 1) {
                np.valor = periodosCalculo[0].valor;
            }
            else {
                var v1 = periodosCalculo[0].valor;
                var v2 = periodosCalculo[1].valor;            
                var sumarValores = this.sumarValores;
                
                np.valor = sumarValores(v1, v2);
            }
            
            // agregar el nuevo período resultante al de períodos arreglados (normalizados)
            periodosArreglados.push(np);
        }
        
        var periodosNormalizados = solapamientos.noSolapadosAnteriores;
        periodosNormalizados = periodosNormalizados.concat(periodosArreglados);
        periodosNormalizados = periodosNormalizados.concat(solapamientos.noSolapadosPosteriores);
        periodosNormalizados = this.unificarPeriodosContiguos(periodosNormalizados);
        
        // asignar los períodos 
        this.periodos = periodosNormalizados;
    }    
}

