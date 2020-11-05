var indigo = indigo || {};
indigo.common = indigo.common || {};
indigo.common.model = indigo.common.model || {};


// Clase Periodo  
indigo.common.model.Periodo = function(tsDesde, tsHasta, pValor){
    if (!indigo.common.util.esEntero(tsDesde)) {
        throw "timestamp de inicio del período incorrecta";
    }    
    
    if (!indigo.common.util.esEntero(tsHasta)) {
        throw "timestamp de fin del período incorrecta";
    }   
    
    if (!(tsDesde < tsHasta)) {
        throw "período incorrecto; el timestamp de fin tiene que ser posterior al de inicio";
    }
    this.desde = tsDesde;
    this.hasta = tsHasta;
    this.valor = pValor;
    
    /////////////////////////////////////////////////////
    // devuelve el time de inicio (desde)
    /////////////////////////////////////////////////////
    this.getDesde = function () {
        return this.desde;
    };    
        
    /////////////////////////////////////////////////////
    // devuelve el time de fin (hasta)
    /////////////////////////////////////////////////////
    this.getHasta = function () {
        return this.hasta;
    };    
    
    /////////////////////////////////////////////////////
    // devuelve el valor del período
    /////////////////////////////////////////////////////
    this.getValor = function () {
        return this.valor;
    };        
    
    /////////////////////////////////////////////////////
    // asigna el valor del período
    /////////////////////////////////////////////////////
    this.setValor = function (v) {
        this.valor = v;
    };       
    
    /////////////////////////////////////////////////////
    // devuelve la duración del período en milisegundos
    /////////////////////////////////////////////////////
    this.getDuracion = function () {
        return (this.hasta - this.desde);
    };    
    
    /////////////////////////////////////////////////////
    // devuelve la duración del período en minutos
    /////////////////////////////////////////////////////
    this.getMinutos = function () {
        var duracion = this.getDuracion();
        return Math.round(duracion / 60000);
    };     
    
    /////////////////////////////////////////////////////
    // devuelve una cadena que identifica el período,
    // teniendo en cuenta sólo el tiempo (no el valor)
    /////////////////////////////////////////////////////
    this.getHashTime = function() {
        return "KEY_" + this.desde + "-" + this.hasta;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve un valor booleano que indica si el período actual se solapa con el periodo "p" o con algún 
    // elemento del array de períodos "p"
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.solapa = function (p) {
        var periodos = indigo.common.model.Periodo.validar(p);
        if (!periodos) {
           throw "el parámetro no es un período ni un array de períodos válido para comprobar si se solapa"; 
        }
        
        // recorrer el array; si se encuentra un elemento que solape, se devuelve true       
        for (var i=0; i < periodos.length; i++) {
            if (periodos[i].desde < this.hasta && periodos[i].hasta > this.desde) {
                return true;
            }
        }          

        // si se llegó a aquí, no hay solapamiento
        return false;
    };    
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve un período nuevo con la intersección del período especificado. El valor del período devuelto 
    // es el del período actual. En caso de que no haya intersección (no solapamiento), no se devuelve nada.    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // TODO: Pendiente de probar
    this.interseccion = function(p) {
        var periodos = indigo.common.model.Periodo.validar(p);
        if (!periodos) {
           throw "el parámetro no es un período válido para intersecar"; 
        } 
        
        if (periodos.length > 1) {
           throw "el parámetro no es un período válido para intersecar (tiene que ser un período, no un array)";  
        }            
        
        var periodo = periodos[0];
        if (!this.solapa(periodo)) {
            return;
        }
        
        // devolver la intersección
        return new indigo.common.model.Periodo(
            Math.max(this.desde, periodo.desde), 
            Math.min(this.hasta, periodo.hasta),
            this.valor
        )            
    }
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Devuelve un array de períodos que resultan de "cortar" o "suprimir" el período especificado p al actual
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // TODO: Pendiente de probar
    this.descartar = function(p){
        var periodos = indigo.common.model.Periodo.validar(p);
        if (!periodos) {
           throw "el parámetro no es un período válido para descartar"; 
        } 
        
        if (periodos.length > 1) {
           throw "el parámetro no es un período válido para descartar (tiene que ser un período, no un array de períodos)";  
        }       

        // array de períodos a devolver
        var resultado = [];
        
        // período a descartar
        var pd = this.interseccion(periodos[0]);
        if (!pd) { // si no hay intersección, se devuelve sólo el período actual
           resultado.push(this);  
        } 
        else { // hay intersección => tomar los límites de los dos períodos (actual e intersección)
            var t1 = this.desde;
            var t2 = pd.desde;
            var t3 = pd.hasta;
            var t4 = this.hasta;
            
            if (t1 != t2) {
                resultado.push(new indigo.common.model.Periodo(t1, t2, this.valor));
            }
            
            if (t3 != t4) {
                resultado.push(new indigo.common.model.Periodo(t3, t4, this.valor));
            }
        }

        return resultado;
    }
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve true sii el parámetro es un timestamp entre el inicio y fin del período (los 
    // períodos se consideran cerrados por la izquierda y abiertos por la derecha, es decir se incluye desde 
    // pero no hasta) o bien un período contenido dentro del actual    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // TODO: Pendiente de probar
    this.contiene = function(p) {
        // caso de que p sea n período
        if (indigo.common.model.Periodo.validar(p)) {
            return (p.desde >= this.desde && p.hasta <= this.hasta)
        }
        
        // caso de que p sea un timestamp
        if (indigo.common.util.esEntero(p)) {
            return (p >= this.desde && p < this.hasta)
        }
        
        // en este punto, 
        return false;
    }
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve un array con los períodos del array "pa" que se solapan con el actual
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.obtenerPeriodosSolapados = function (pa) {
        // array de períodos a considerar
        var periodos = indigo.common.model.Periodo.validar(pa)
        if (!periodos) {
            throw "el parámetro no es un período ni un array de períodos válido para obtener períodos solapados"; 
        }
        
        var resultado = [];
        for (var i=0; i < periodos.length; i++) {
           if (this.solapa(periodos[i])) {
              resultado.push(periodos[i]);
           }          
        }
        
        return resultado;    
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve un array con los los períodos del array "pa" que se solapan con el actual, cortando lo que 
    // queda fuera del período actual
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.obtenerPeriodosSolapadosConCorte = function (pa) {
       var result = [];
       var solapados = this.obtenerPeriodosSolapados(pa);
       
       for (var i=0; i < solapados.length; i++) {
           var desde = Math.max(solapados[i].desde, this.desde);
           var hasta = Math.min(solapados[i].hasta, this.hasta);
           var valor = solapados[i].valor;
           
           result.push(new indigo.common.model.Periodo(desde, hasta, valor));
       }
       
       return result;    
    };

    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // devuelve un objeto con los períodos del array "pa" divididos en tres bloques: "noSolapadosAnteriores", 
    // con los períodos de "pa" que no se solapan con el actual y que son anteriores a los que se solapan, 
    // "solapados", con los períodos de "pa" que se solapan, y "noSolapadosPosteriores" con los
    // períodos de "pa" que no se solapan con el actual y son posteriores a los solapados.
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    this.obtenerSolapamientos = function (pa) {
        // objeto con los resultados a devolver
        var resultado = {};
        resultado.noSolapadosAnteriores = [];
        resultado.solapados = [];
        resultado.noSolapadosPosteriores = [];
        
        // chequear los elementos del array componiendo los resultados:
        var periodo;
        
        for (var i = 0; i < pa.length; i++) {
            periodo = pa[i];
            if (this.solapa(periodo)) {
               resultado.solapados.push(periodo);
            }
            else if (periodo.desde < this.desde) {
               resultado.noSolapadosAnteriores.push(periodo); 
            }
            else {
               resultado.noSolapadosPosteriores.push(periodo);
            }
        }
        
        return resultado;
    };
     
}


/////////////////////////////////////////////////////
// Métodos de clase (estáticos)
/////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// valida que el parámetro sea un período o un array de períodos. En caso de que la validación sea OK, se 
// devuelve un array con los períodos o período especificado, en caso contrario debuelve undefined, por lo 
// que se puede usar esta función como si devolviese un valor booleano.
//////////////////////////////////////////////////////////////////////////////////////////////////////////
indigo.common.model.Periodo.validar = function(p) {
    if (p == undefined) {
        return;
    }

    // array con los presuntos períodos
    var periodos = p;
    if (!Array.isArray(periodos)) {
        periodos = [p];
    }
    
    // recorrer el array, comprobando que cada elemento tiene inicio y fin 
    // del período y son coherentes; si se detecta uno que no lo es, se devuelve undefined.    
    for (var i=0; i < periodos.length; i++) {
        var px = periodos[i];
        if (!indigo.common.util.esEntero(px.desde)) {
            return;
        } else if (!indigo.common.util.esEntero(px.hasta)) {
            return;
        } else if (px.desde >= px.hasta) {
            return; 
        }           
    }
    
    // si se llegó aquí, p es válido => devolver el array
    return periodos;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////
// función de comparación entre dos períodos (por el atributo "desde"), para poder establecer comparaciones.
//////////////////////////////////////////////////////////////////////////////////////////////////////////
indigo.common.model.Periodo.comparador = function(p1, p2) {
    if (!indigo.common.model.Periodo.validar(p1) || !indigo.common.model.Periodo.validar(p2)) {
        throw "períodos no válidos para el comparador";
    }    
    var t1 = p1.desde;
    var t2 = p2.desde;
    
    return t1 - t2;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////
// devuelve true sii el array de periodos "pa" está ordenado por la comparación establecida por "desde"
//////////////////////////////////////////////////////////////////////////////////////////////////////////
indigo.common.model.Periodo.ordenado = function(pa) {
    // array con los períodos a considerar
    var periodos = indigo.common.model.Periodo.validar(pa);
    if (!periodos) {
        throw "período(s) no válido(s) para chequear si están ordenados";
    }    
    
    var resultado = true;
    for (var i = 1; i < periodos.length; i++) {
       if (indigo.common.model.Periodo.comparador(periodos[i-1], periodos[i]) > 0) {
          resultado = false;
          break;
       }          
    }        
     
    return resultado;
};



//////////////////////////////////////////////////////////////////////////////////////////////////////////
// devuelve un array (ordenado y sin duplicados) con todos los valores de atributos "desde" y "hasta" del 
// array de períodos especificado. En caso de especificar los timestamp inicial y/o final, se descartan
// los puntos de corte que no estén comprendidos en ese intervalo.
//////////////////////////////////////////////////////////////////////////////////////////////////////////
indigo.common.model.Periodo.obtenerPuntosDeCorte = function (pa, tsInicio, tsFinal) {
    // array con los períodos a considerar
    var periodos = indigo.common.model.Periodo.validar(pa);
    if (!periodos) {
        throw "período(s) no válido(s) para obtener los puntos de corte";
    }
    
    // determinar los timestamp de inicio y fin a usar (si no es especificaron , se asignan valores límite)
    var ti = tsInicio;
    if (typeof ti == "undefined") {
        ti = -8640000000000000; // valor de time mínimo
    }
    
    var tf = tsFinal;
    if (typeof tf == "undefined") {
        tf = +8640000000000000; // valor de time máximo
    }    
    
    // validar que los timestamp son correctos (valores enteros)
    if (!indigo.common.util.esEntero(ti) || !indigo.common.util.esEntero(ti)) {
       throw "límites de tiempo no válido(s) para obtener los puntos de corte";
    }
    
    // array con los puntos de corte a devolver
    var resultado = [];
    for (var i=0; i < periodos.length; i++) {
       var t1 = periodos[i].desde;
       if (resultado.indexOf(t1) < 0 && (t1 >= ti) && (t1 <= tf)) {
          resultado.push(t1);
       };
       
       var t2 = periodos[i].hasta;
       if (resultado.indexOf(t2) < 0 && (t2 >= ti) && (t2 <= tf)) {
          resultado.push(t2);
       };           
    }
    
    return resultado.sort();
};      

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// devuelve de los períodos especificados (pa), los que contienen el timestamp (t) 
//////////////////////////////////////////////////////////////////////////////////////////////////////////
// TODO: Pendiente probar
indigo.common.model.Periodo.extraerPeriodosPorTimestamp = function (pa, t) {
    // array con los períodos a considerar
    var periodos = indigo.common.model.Periodo.validar(pa);
    if (!periodos) {
        throw "período(s) no válido(s) para extraer por timestamp";
    }

    // validar que el timestamp es correcto 
    if (!indigo.common.util.esEntero(t)) {
       throw "timestamp no válido para extraer períodos";
    }    
    
    // array con los períodos a devolver
    var resultado = [];
    for (var i=0; i < periodos.length; i++) {
        var p = periodos[i];
        if (p.contiene(t)) {
            resultado.push(p);
        }           
    }
    
    return resultado;
};  
