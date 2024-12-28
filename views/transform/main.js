import "./site.css";

const ATTR_XSLT = "[xslt-onload]";
const ATTR_XSLT_TEMPLATE = "xslt-template";
const ATTR_XSLT_STATE = "xslt-transformed";

function setup_xslt(evt) {
	let els = document.querySelectorAll(ATTR_XSLT);
	for (let element of els) {
		if (element.getAttribute(ATTR_XSLT_STATE) === "true") {
			continue;
		}
		let templateId = element.getAttribute(ATTR_XSLT_TEMPLATE);
		let template = htmx.find("#" + templateId);
		if (template) {
			let content = template.innerHTML
				? new DOMParser().parseFromString(template.innerHTML, "application/xml")
				: template.contentDocument;
			let processor = new XSLTProcessor();
			processor.importStylesheet(content);
			let data = new DOMParser().parseFromString(element.innerHTML, "application/xml");
			let frag = processor.transformToFragment(data, document);
			let s = new XMLSerializer().serializeToString(frag);
			element.innerHTML = s;
			element.setAttribute(ATTR_XSLT_STATE, true);
		} else {
			throw new Error("Unknown XSLT template: " + templateId);
		}
	}
}

function setup() {
	setup_xslt(null);
	htmx.on("htmx:load", setup_xslt);
	let templates = document.querySelectorAll("template[simple]");
	templates.forEach((template) => {
		let templateId = template.getAttribute("id");
		let templateContent = template.content;

		customElements.define(
			templateId,
			class extends HTMLElement {
				constructor() {
					super();
					this.appendChild(templateContent.cloneNode(true));
					this.slots = this.querySelectorAll("slot");
				}

				connectedCallback() {
					let toremove = [];
					this.slots.forEach((tslot) => {
						let slotName = tslot.getAttribute("name");
						let slotContent = this.querySelector(`[slot="${slotName}"]`);
						if (slotContent) {
							tslot.replaceWith(slotContent.cloneNode(true));
							toremove.push(slotContent);
						}
					});
					toremove.forEach((element) => {
						element.remove();
					});
				}
			},
		);
	});
}

export { setup };
