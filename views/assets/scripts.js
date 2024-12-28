const u = "[xslt-onload]", f = "xslt-template", a = "xslt-transformed", c = "xslt-remote-template";
function h() {
  let t = htmx.findAll(u);
  for (let n of t)
    d(n);
}
function d(t) {
  if (t.getAttribute(a) === "true")
    return;
  let n = t.getAttribute(f), o = htmx.find("#" + n);
  if (o) {
    let s = o.innerHTML ? new DOMParser().parseFromString(o.innerHTML, "application/xml") : o.contentDocument;
    console.log(s);
    let l = new XSLTProcessor();
    l.importStylesheet(s);
    let e = new DOMParser().parseFromString(t.innerHTML, "application/xml"), i = l.transformToFragment(e, document), r = new XMLSerializer().serializeToString(i);
    t.innerHTML = r, t.setAttribute(a, !0);
  } else if (t.hasAttribute(c)) {
    let s = t.getAttribute(c), l = new Request(s, {
      headers: { "Content-Type": "application/xslt+xml" },
      cache: "default"
    });
    fetch(l).then((e) => e.text()).then((e) => {
      let i = new DOMParser().parseFromString(e, "application/xslt+xml"), r = new XSLTProcessor();
      r.importStylesheet(i);
      let p = new DOMParser().parseFromString(t.innerHTML, "application/xml"), T = r.transformToFragment(p, document), m = new XMLSerializer().serializeToString(T);
      t.innerHTML = m, t.setAttribute(a, !0);
    });
  } else
    throw new Error("Unknown XSLT template: " + n);
}
function S() {
  h(), document.querySelectorAll("template[simple]").forEach((n) => {
    let o = n.getAttribute("id"), s = n.content;
    customElements.define(
      o,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(s.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let l = [];
          this.slots.forEach((e) => {
            let i = e.getAttribute("name"), r = this.querySelector(`[slot="${i}"]`);
            r && (e.replaceWith(r.cloneNode(!0)), l.push(r));
          }), l.forEach((e) => {
            e.remove();
          });
        }
      }
    );
  });
}
export {
  S as setup
};
