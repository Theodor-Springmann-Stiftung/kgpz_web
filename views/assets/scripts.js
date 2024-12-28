const p = "[xslt-onload]", T = "xslt-template", i = "xslt-transformed";
function a(c) {
  let o = document.querySelectorAll(p);
  for (let e of o) {
    if (e.getAttribute(i) === "true")
      continue;
    let r = e.getAttribute(T), t = htmx.find("#" + r);
    if (t) {
      let l = t.innerHTML ? new DOMParser().parseFromString(t.innerHTML, "application/xml") : t.contentDocument, s = new XSLTProcessor();
      s.importStylesheet(l);
      let n = new DOMParser().parseFromString(e.innerHTML, "application/xml"), m = s.transformToFragment(n, document), u = new XMLSerializer().serializeToString(m);
      e.innerHTML = u, e.setAttribute(i, !0);
    } else
      throw new Error("Unknown XSLT template: " + r);
  }
}
function d() {
  a(), htmx.on("htmx:load", a), document.querySelectorAll("template[simple]").forEach((o) => {
    let e = o.getAttribute("id"), r = o.content;
    customElements.define(
      e,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(r.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let t = [];
          this.slots.forEach((l) => {
            let s = l.getAttribute("name"), n = this.querySelector(`[slot="${s}"]`);
            n && (l.replaceWith(n.cloneNode(!0)), t.push(n));
          }), t.forEach((l) => {
            l.remove();
          });
        }
      }
    );
  });
}
export {
  d as setup
};
