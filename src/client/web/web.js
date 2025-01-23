// ============================================================================================================================ //
//  getCookies()                                                                                                                //
// ============================================================================================================================ //
export function getCookies() {
  let cookies = {};

  document.cookie.split("; ").forEach(cookie => {
    if(cookie) {
      let [ name, value ] = cookie.split("=");
      cookies[name] = value;
    }
  });

  return cookies;
}

// ============================================================================================================================ //
//  setCookie()                                                                                                                 //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Sets or overwrites a cookie                                                                                                 //
// ============================================================================================================================ //
export function setCookie(name, value, maxAge) {
  document.cookie = [
    name + "=" + value,
    ...maxAge ? [ "max-age=" + maxAge ] : [],
    "SameSite=Lax",
    [ ...document.location.protocol == "https:" ? [ "Secure" ] : [] ]
  ]
  .join("; ");
}

// ============================================================================================================================ //
//  get()                                                                                                                       //
// ============================================================================================================================ //
export function get(selector) {
  let el = document.querySelector(selector);

  if(el == undefined) {
    throw `can't find element '${selector}'`;
  }

  return elementToObject(el);
}

// ============================================================================================================================ //
//  create()                                                                                                                    //
// ============================================================================================================================ //
export function create(type, id) {
  let el = elementToObject(document.createElement(type));

  if(id) {
    el.setAttribute("id", id);
  }

  return el;
}

// ============================================================================================================================ //
//  elementToObject()                                                                                                           //
// ============================================================================================================================ //
export function elementToObject(el) {
  function setListener(name, callback) {
    unsetListener(name);
    obj.listener[name] = callback;
    el.addEventListener(name, callback);
  }

  function unsetListener(name) {
    if(obj.listener[name]) {
      el.removeEventListener(name, obj.listener[name]);
      delete obj.listener[name];
    }
  }

  let obj = {
    el: el,
    listener: {},

    style: function(arg) {
      if(arg) {
        Object.keys(arg).forEach(key => el.style[key] = arg[key]);
      }
      return obj;
    },

    click: function(callback) {
      setListener("click", callback);
      return obj;
    },

    setContent: function(...list) {
      obj.clear();
      list.forEach(content => obj.append(content));
      return obj;
    }
  };

  return obj;
}
