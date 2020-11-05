var indigo = indigo || {};
indigo.common = indigo.common || {};
indigo.common.model = indigo.common.model || {};

// Modelo para representar un período de tiempo con un conjunto de períodos
indigo.common.model.CeldaHoraria = function(tsDesde, tsHasta) {
    if (!indigo.common.util.esEntero(tsDesde)) {
        throw "timestamp (time) de inicio de celda horaria incorrecta";
    }    
    
    if (!indigo.common.util.esEntero(tsHasta)) {
        throw "fecha y hora de fin de celda horaria incorrecta";
    }  
    
    if (!(tsDesde < tsHasta)) {
        throw "celda horaria incorrecta; la fecha de fin tiene que ser posterior a la de inicio";
    }
    
    // asignar las propiedades
    this.desde = tsDesde;
    this.hasta = tsHasta;   
    this.periodos = []; 
    
    // devuelve la duración del período en milisegundos
    this.getDuracion = function () {
        return this.hasta - this.desde;
    };

    // devuelve un valor booleano que indica si la celda actual se solapa con el periodo "p"
    this.seSolapaConPeriodo = function (p) {
       var solapa = false;
       
       if (p.desde < this.hasta && p.hasta > this.desde) {
           solapa = true;
       }
       return solapa;
    };

    // devuelve un array con los los períodos del array "pa" que se solapan con la celda actual, cortando lo que queda fuera de la celda 
    this.obtenerPeriodosSolapadosConCorte = function (pa) {
       var result = [];
       
       for (var i=0; i < pa.length; i++) {
           if (this.seSolapaConPeriodo(pa[i])) {
               var desde = Math.max(pa[i].desde, this.desde);
               var hasta = Math.min(pa[i].hasta, this.hasta);
               var valor = pa[i].valor;
               
               var pn = new indigo.common.model.Periodo(desde, hasta, valor);
               result.push(pn);           
           }

       }
       
       return result;    
    }        
        
}

////////////////////
// métodos de clase
////////////////////

// devuelve un array de celdas horarias con la duración establecida, y asignando a cada una los períodos que corresponden
indigo.common.model.CeldaHoraria.crearCeldasHorarias = function(inicio, fin, duracion, periodos) {
      var celdas = [];
      var desde = inicio;
      while (desde < fin) {
           var nc = new indigo.common.model.CeldaHoraria(desde, desde + duracion);
          
           nc.periodos = nc.obtenerPeriodosSolapadosConCorte(periodos);
           celdas.push(nc);
           
           desde += duracion;
      }
      
      return celdas;
}    

