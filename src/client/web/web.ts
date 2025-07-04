// ============================================================================================================================ //
//  getCookies()                                                                                                                //
// ============================================================================================================================ //
export function getCookies() {
  let cookies = {};

  document.cookie.split("; ").forEach(cookie => {
    if(cookie) {
      let [ name, value ] = cookie.split("=");
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
export function setCookie(name: any, value: any, maxAge: any) {
  document.cookie = [
    name + "=" + value,
    ...(maxAge ? [ "max-age=" + maxAge ] : []),
    "SameSite=Lax",
    [ ...(document.location.protocol == "https:" ? [ "Secure" ] : []) ]
  ]
  .join("; ");
}

// ============================================================================================================================ //
//  get()                                                                                                                       //
// ============================================================================================================================ //
export function get(selector: any) {
  let el = document.querySelector(selector);

  if(el == undefined) {
    throw `can't find element '${selector}'`;
  }

  return elementToObject(el);
}

// ============================================================================================================================ //
//  create()                                                                                                                    //
// ============================================================================================================================ //
export function create(type: any, id: any) {
  let el = elementToObject(document.createElement(type));

  if(id) {
    el.setAttribute("id", id);
  }

  return el;
}

// ============================================================================================================================ //
//  elementToObject()                                                                                                           //
// ============================================================================================================================ //
export function elementToObject(el: any) {
  function setListener(name: any, callback: any) {
    unsetListener(name);
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    obj.listener[name] = callback;
    el.addEventListener(name, callback);
  }

  function unsetListener(name: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if(obj.listener[name]) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      el.removeEventListener(name, obj.listener[name]);
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      delete obj.listener[name];
    }
  }

  let obj = {
    el: el,
    listener: {},

    style: function(arg: any) {
      if(arg) {
        Object.keys(arg).forEach(key => el.style[key] = arg[key]);
      }
      return obj;
    },

    setAttribute: function(key: any, value = "1") {
      el.setAttribute(key, value);
      return obj;
    },

    getAttribute: function(key: any) {
      return el.getAttribute(key);
    },

    html: function(html: any) {
      el.innerHTML = html;
      return obj;
    },

    click: function(callback: any) {
      setListener("click", callback);
      return obj;
    },

    clear: function() {
      while(el.firstChild){
        el.removeChild(el.firstChild);
      }
      return obj;
    },

    setContent: function(...list: any[]) {
      obj.clear();
      // @ts-expect-error TS(2339): Property 'append' does not exist on type '{ el: an... Remove this comment to see the full error message
      list.forEach(content => obj.append(content));
      return obj;
    }
  };

  return obj;
}
