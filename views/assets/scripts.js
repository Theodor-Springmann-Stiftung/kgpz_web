const u = "[xslt-onload]", a = "xslt-template", c = "xslt-transformed", i = /* @__PURE__ */ new Map();
function p() {
  let t = htmx.findAll(u);
  for (let e of t)
    f(e);
}
function f(t) {
  if (t.getAttribute(c) === "true" || !t.hasAttribute(a))
    return;
  let e = "#" + t.getAttribute(a), r = i.get(e);
  if (!r) {
    let o = htmx.find(e);
    if (o) {
      let n = o.innerHTML ? new DOMParser().parseFromString(o.innerHTML, "application/xml") : o.contentDocument;
      r = new XSLTProcessor(), r.importStylesheet(n), i.set(e, r);
    } else
      throw new Error("Unknown XSLT template: " + e);
  }
  if (r) {
    let o = new DOMParser().parseFromString(t.innerHTML, "application/xml"), n = r.transformToFragment(o, document), s = new XMLSerializer().serializeToString(n);
    t.innerHTML = s, t.setAttribute(c, !0), htmx.process(t);
  } else
    throw new Error("No Processor: " + e);
}
function T() {
  document.querySelectorAll("template[simple]").forEach((e) => {
    let r = e.getAttribute("id"), o = e.content;
    customElements.define(
      r,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(o.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let n = [];
          this.slots.forEach((s) => {
            let m = s.getAttribute("name"), l = this.querySelector(`[slot="${m}"]`);
            l && (s.replaceWith(l.cloneNode(!0)), n.push(l));
          }), n.forEach((s) => {
            s.remove();
          });
        }
      }
    );
  });
}
function h() {
  p(), htmx.on("htmx:afterSettle", function(t) {
    i.clear(), p();
  }), T();
}
export {
  h as setup
};
