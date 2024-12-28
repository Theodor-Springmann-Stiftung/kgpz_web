import "./site.css";

const ATTR_XSLT_ONLOAD = "[xslt-onload]";
const ATTR_XSLT_TEMPLATE = "xslt-template";
const ATTR_XSLT_STATE = "xslt-transformed";
const ATTR_XSLT_REMOTE_TEMPLATE = "xslt-remote-template";

function setup_xslt() {
	let els = htmx.findAll(ATTR_XSLT_ONLOAD);
	for (let element of els) {
		transform_xslt(element);
	}
}

function transform_xslt(element) {
	if (element.getAttribute(ATTR_XSLT_STATE) === "true") {
		return;
	}
	let templateId = element.getAttribute(ATTR_XSLT_TEMPLATE);
	let template = htmx.find("#" + templateId);
	if (template) {
		let content = template.innerHTML
			? new DOMParser().parseFromString(template.innerHTML, "application/xml")
			: template.contentDocument;
		console.log(content);
		let processor = new XSLTProcessor();
		processor.importStylesheet(content);
		let data = new DOMParser().parseFromString(element.innerHTML, "application/xml");
		let frag = processor.transformToFragment(data, document);
		let s = new XMLSerializer().serializeToString(frag);
		element.innerHTML = s;
		element.setAttribute(ATTR_XSLT_STATE, true);
	} else if (element.hasAttribute(ATTR_XSLT_REMOTE_TEMPLATE)) {
		let url = element.getAttribute(ATTR_XSLT_REMOTE_TEMPLATE);
		let req = new Request(url, {
			headers: { "Content-Type": "application/xslt+xml" },
			cache: "default",
		});
		// WARNING: It is important to set the right cache cache policy server-side; else a request is
		// made every time.
		fetch(req)
			.then((response) => response.text())
			.then((text) => {
				let content = new DOMParser().parseFromString(text, "application/xslt+xml");
				let processor = new XSLTProcessor();
				processor.importStylesheet(content);
				let data = new DOMParser().parseFromString(element.innerHTML, "application/xml");
				let frag = processor.transformToFragment(data, document);
				let s = new XMLSerializer().serializeToString(frag);
				element.innerHTML = s;
				element.setAttribute(ATTR_XSLT_STATE, true);
			});
	} else {
		throw new Error("Unknown XSLT template: " + templateId);
	}
}

function setup() {
	setup_xslt();
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
