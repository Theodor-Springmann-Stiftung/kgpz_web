// This is a queue that stores functions to be executed after the DOM is settled.
// It is used to ensure the DOM is fully rendered before executing certain actions.
// Works as well as a DOMContentLoaded event listener.

const settleQueue = [];

document.addEventListener("DOMContentLoaded", () => {
	ExecuteSettleQueue();
});

const ExecuteNextSettle = function (fn) {
	if (typeof fn === "function") {
		settleQueue.push(fn);
	}
};

const DeleteNextSettle = function (fn) {
	const index = settleQueue.indexOf(fn);
	if (index !== -1) {
		settleQueue.splice(index, 1);
	}
};

const ExecuteSettleQueue = function () {
	while (settleQueue.length > 0) {
		const fn = settleQueue.shift();
		try {
			fn();
		} catch (error) {
			console.error("Error executing settle queue function:", error);
		}
	}
};

export { ExecuteNextSettle, ExecuteSettleQueue, DeleteNextSettle };
