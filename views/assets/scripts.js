const p = "script[xslt-onload]", a = "xslt-template", u = "xslt-transformed", c = /* @__PURE__ */ new Map();
function m() {
  let t = htmx.findAll(p);
  for (let e of t)
    T(e);
}
function T(t) {
  if (t.getAttribute(u) === "true" || !t.hasAttribute(a))
    return;
  let e = "#" + t.getAttribute(a), o = c.get(e);
  if (!o) {
    let n = htmx.find(e);
    if (n) {
      let l = n.innerHTML ? new DOMParser().parseFromString(n.innerHTML, "application/xml") : n.contentDocument;
      o = new XSLTProcessor(), o.importStylesheet(l), c.set(e, o);
    } else
      throw new Error("Unknown XSLT template: " + e);
  }
  let i = new DOMParser().parseFromString(t.innerHTML, "application/xml"), s = o.transformToFragment(i, document), r = new XMLSerializer().serializeToString(s);
  t.outerHTML = r;
}
function f() {
  document.querySelectorAll("template[simple]").forEach((e) => {
    let o = e.getAttribute("id"), i = e.content;
    customElements.define(
      o,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(i.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let s = [];
          this.slots.forEach((r) => {
            let n = r.getAttribute("name"), l = this.querySelector(`[slot="${n}"]`);
            l && (r.replaceWith(l.cloneNode(!0)), s.push(l));
          }), s.forEach((r) => {
            r.remove();
          });
        }
      }
    );
  });
}
function d() {
  m(), htmx.on("htmx:load", function(t) {
    m();
  }), f();
}
export {
  d as setup
};
