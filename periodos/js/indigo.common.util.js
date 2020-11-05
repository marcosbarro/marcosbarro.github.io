var indigo = indigo || {};
indigo.common = indigo.common || {};
indigo.common.util = indigo.common.util || {};

// función que devuelve TRUE sii el valor especificado es un número entero (no vale una cadena con un número)
indigo.common.util.esEntero = function(value) {
   if (!typeof value == "number") {
      return false;
   }
   
   if (value != Math.floor(value)) {
      return false;
   }
   
   return true;
}

// función que devuelve la cadena que resulta de añadir un carácter c por la izquierda hasta completar n caracteres
indigo.common.util.leftPad = function(str, c, n) {
    var result = str;
    
    if (c && n && (n > str.length) && (c.length == 1)) {
       result = (new Array(n + 1 - str.length)).join(c) + str;
    }
    
    return result; 
}


// función que devuelve una cadena en formato HH:MM con el componente hora de la fecha especificada
indigo.common.util.formatoHHMM = function(d) {
    var ceros = "00";
    var hh = ceros + d.getHours();
    hh = hh.substr(hh.length - ceros.length, 2);
    
    var mm = ceros + d.getMinutes();
    mm = mm.substr(mm.length - ceros.length, 2);
    
    return hh + ":" + mm;
}

// función para identificadores únicos universales
indigo.common.util.generateUUID = function() {
        var d = new Date().getTime();
        if(window.performance && typeof window.performance.now === "function"){
            d += performance.now();; //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid; 
}

// Clase para funciones aleatorias
indigo.common.util.Random = function() {
   var _letras      = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
   var _consonantes = ['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z'];
   var _vocales     = ['a','e','i','o','u'];
   
   // devuelve un entero aleatorio en el rango especificado
   this.getInteger = function(minimo, maximo) {
      return Math.floor((Math.random() * maximo) + minimo);
   };
   
   // devuelve un elemento aleatorio del array especificado
   this.getArrayItem = function(a) {
      var i = this.getInteger(0, a.length-1);
      return a[i];
   };
   
   // devuelve un array con n elementos del array especificado
   this.getSubArray = function(a, n) {
      var result = [];
      var contador = n;
      
      var indices = [];
      for (var i=0; i < a.length; i++) {
         indices.push(i);
      }
      
      if (!contador || contador > a.length) {
         contador = this.getInteger(1, a.length);
      }

      for (var i = 0; i < contador; i++) {
         var indice = this.getArrayItem(indices);
         
         result.push(a[indice]);
         indices.splice(indice, 1);
      }

      return result;
   };   
   
   // devuelve una letra aleatoria
   this.getLetra = function(){
      return this.getArrayItem(_letras);
   }
   
   // devuelve una consonante aleatoria
   this.getConsonante = function(){
      return this.getArrayItem(_consonantes);
   }   
   
   // devuelve una vocal aleatoria
   this.getVocal= function(){
      return this.getArrayItem(_vocales);
   }

   // devuelve una cadena con letras aleatorias, alternando consonantes y vocales si se especifica 
   this.getCadena = function(longitud, alternar) {
       var result = "";
       
       for (var i = 0; i < longitud; i++) {
           if (!alternar) {
              result += this.getLetra();
           }
           else {
              if (i%2 === 0) {
                 result += this.getConsonante();
              }
              else {
                 result += this.getVocal();
              }
           }
       }
       
       return result;
   }   
}

// Clase para almacenamiento de elementos (de cualquier tipo) accesibles por clave autogenerada y por etiquetas
// si se especifica un valor distinto de false en oneTagByItem, el contenedor no permitirá asignar más de una etiqueta a un elemento
indigo.common.util.Container = function(oneTagByItem) {
    var _keys = [];     // array con las claves de acceso a los elementos del contenedor
    var _itemMap = {};  // mapa con los elementos del contenedor. Se accede a cada elemento por un valor de clave que está en _keys[]
    var _tags = [];     // array con los tags del contenedor
    var _keysByTagMap = {};   // mapa con los array de claves para cada tag. La clave de este mapa son los tags (_tags[]), y los valores son las claves de los valores (_keys[])
    var _tagsByKeyMap = {};   // mapa con arrays de etiquetas para cada clave.
    
    // propiedad para determinar si cada elemento del contenedor sólo puede tener una etiqueta
    this.oneTagByItem = oneTagByItem;
    
    // agrega al contenedor un elemento y devuelve una clave para poder recuperarlo porsteriormente
    this.add = function(item, tag) {
        var key = indigo.common.util.generateUUID();
        
        _keys.push(key);
        _itemMap[key] = item;
        
        if (tag) { // si se especificó una etiqueta, asignársela al elemento (a través de la clave)
           this.setTag(tag, key);
        }
        
        return key;
    };
    
    // devuelve el elemento para el índice o clave especificado
    this.get = function(indexOrKey) {
        var key = indexOrKey;
        
        if (indigo.common.util.esEntero(indexOrKey)) {
           key = _keys[indexOrKey];
        };
        
        return _itemMap[key];
    };
    
    // devuelve un array con todos los elementos del contenedor
    this.getAll = function() {
        var result = [];
        
        for (var i = 0; i < _keys.length; i++) {
           var key = _keys[i];
           result.push(_itemMap[key]);
        }
        
        return result;
    };
    
    // devuelve el número de elementos del contenedor
    this.count = function() {
        return _keys.length; 
    };
    
    // devuelve un array con las etiquetas existentes en el contenedor
    this.getTags = function() {
        return _tags.slice();
    };
        
    // devuelve una array con los tags del elemento del contenedor con la clave especificada
    this.getTagsByKey = function(key) {
        var tags = _tagsByKeyMap[key];
        if (!tags) {
           return [];
        }
        return tags.slice();
    };
    
    // asigna la etiqueta al elemento del contenedor con la clave especificada
    this.setTag = function(tag, key) {
        if (_keys.indexOf(key) < 0) {
           return;
        }
        
        // obtener el array de etiquetas para la clave especificada 
        var tagsForKey = _tagsByKeyMap[key];
        if (!tagsForKey) {
           tagsForKey = [];
        }
        
        // si la clave ya tiene asociada la etiqueta, no hay que hacer nada
        if (tagsForKey.indexOf(tag) >= 0) {
           return;
        }
        
        // En caso de que el contenedor no permita más de una etiqueta por elemento, chequear que sea así
        if (this.oneTagByItem) {
           if (tagsForKey.length > 0) {
              throw "El contenedor ya tiene asignada una etiqueta para el elemento especificado"; 
           }
        }     
        
        // agregar la etiqueta al array y actualizar el mapa 
        tagsForKey.push(tag);
        _tagsByKeyMap[key] = tagsForKey;
        
             
        // obtener el array de claves para la etiqueta especificada y actualizarlo
        var keysWithTag = _keysByTagMap[tag];
        if (!keysWithTag) { 
           keysWithTag = [];
        }
        keysWithTag.push(key);
        _keysByTagMap[tag] = keysWithTag;
        
        // si la etiqueta no está registrada, añadirla al contenedor
        if (_tags.indexOf(tag) < 0) {
           _tags.push(tag);
        }

    };
    
    // devuelve una array con los elementos del contenedor que tienen asociados la etiqueta especificada
    this.getByTag = function(tag) {
        var result = [];
        
        // obtener el array de claves con la etiquetas especificada
        var keysWithTag = _keysByTagMap[tag];
        if (keysWithTag) {
           for (var i = 0; i < keysWithTag.length; i++) {
               var key = keysWithTag[i];
               result.push(_itemMap[key]); 
           }
        };
        
        return result;
    };
    

}