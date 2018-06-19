import AutoSizer from "./AutoSizer";
import ImageLoaded, {CHECK_ALL, CHECK_ONLY_ERROR} from "./ImageLoaded";
import ItemManager from "./ItemManager";
import {matchHTML} from "./utils";
import {DUMMY_POSITION} from "./consts";

function hasTarget(...targets) {
	return targets.every(target => ~target[0].indexOf(target[1]));
}

export default class LayoutMananger {
	constructor(items, renderer, options = {}) {
		Object.assign(this.options = {
			attributePrefix: "data-",
			isEqualSize: false,
			isConstantSize: false,
			horizontal: false,
		}, options);

		this._items = items;
		this._renderer = renderer;
		this._layout = null;
	}
	setLayout(layout) {
		this._layout = layout;
	}
	setSize(size) {
		this._layout.setSize(size);
	}
	_complete(groups, items, isAppend, isUpdate, callback) {
		const itemManager = this._items;
		const cursor = isAppend ? "end" : "start";
		const groupIndex = itemManager.indexOf(groups[0]);
		const prevGroup = itemManager.getData(groupIndex + (isAppend ? -1 : 1));
		let outline = prevGroup ? prevGroup.outlines[cursor] : [0];

		this._renderer.updateSize(items);

		groups.forEach(group => {
			const groupOutline = group.outlines[isAppend ? "start" : "end"];
			const isRelayout = isUpdate || !outline.length || (outline.length === groupOutline.length ?
				!outline.every((v, index) => v === groupOutline[index]) : true);

			if (!isRelayout) {
				outline = group.outlines[isAppend ? "end" : "start"];
				return;
			}
			const groupItems = group.items;
			const groupInfo = this._layout[isAppend ? "append" : "prepend"](groupItems, outline);

			Object.assign(group, groupInfo);
			outline = groupInfo.outlines[isAppend ? "end" : "start"];
		});
		callback({
			groups,
			items,
			isAppend,
		});
	}
	_error(removeTarget, replaceTarget, target, items, errorIndex, callback) {
		const item = items[errorIndex];
		const element = item.el;
		const prefix = this.options.attributePrefix;

		// remove item
		const removeItem = () => {
			if (hasTarget([removeTarget, element])) {
				return;
			}
			removeTarget.push(element);
			const index = replaceTarget.indexOf(errorIndex);

			index !== -1 && replaceTarget.splice(index, 1);
		};
		// remove image
		const remove = () => {
			if (target === element) {
				removeItem();
				return;
			}
			if (hasTarget([removeTarget, element])) {
				return;
			}
			target.parentNode.removeChild(target);
			item.content = element.outerHTML;
			if (hasTarget([replaceTarget, errorIndex])) {
				return;
			}
			replaceTarget.push(errorIndex);
		};
		// replace image
		const replace = src => {
			if (hasTarget([removeTarget, element])) {
				return;
			}
			if (src) {
				if (matchHTML(src) || typeof src === "object") {
					const parentNode = target.parentNode;

					parentNode.insertBefore($(src), target);
					parentNode.removeChild(target);
					item.content = element.outerHTML;
				} else {
					target.src = src;
					if (target.getAttribute(`${prefix}width`)) {
						AutoSizer.remove(target);
						target.removeAttribute(`${prefix}width`);
						target.removeAttribute(`${prefix}height`);
					}
				}
			}
			item.content = element.outerHTML;
			if (hasTarget([replaceTarget, errorIndex])) {
				return;
			}
			replaceTarget.push(errorIndex);
		};
		// replace item
		const replaceItem = content => {
			if (hasTarget([removeTarget, element], [replaceTarget, errorIndex])) {
				return;
			}
			element.innerHTML = content;
			item.content = element.outerHTML;
			replaceTarget.push(errorIndex);
		};

		callback({
			target,
			element,
			items,
			item,
			itemIndex: errorIndex,
			replace,
			replaceItem,
			remove,
			removeItem,
		});
	}
	_end(removeTarget, replaceTarget, items, callback) {
		const {attributePrefix} = this.options;

		const removeTargetLength = removeTarget.length;
		const replaceTargetLength = replaceTarget.length;

		if (!removeTargetLength && !replaceTargetLength) {
			callback({remove: []});
			return;
		}
		const layoutedItems = replaceTarget.map(itemIndex => items[itemIndex]);

		if (!replaceTargetLength) {
			callback({remove: removeTarget, layout: true});
			return;
		}
		// wait layoutComplete beacause of error event.
		ImageLoaded.check(layoutedItems.map(v => v.el), {
			prefix: attributePrefix,
			complete: () => {
				this._renderer.updateSize(layoutedItems);
				callback({remove: removeTarget, layout: true});
			},
		});
	}
	_insert({
		groups,
		items = ItemManager.pluck(groups, "items"),
		isAppend,
		isUpdate,
	}, {
		error = () => {},
		complete = () => {},
		end = () => {},
	}) {
		if (!groups.length) {
			return;
		}
		const replaceTarget = [];
		const removeTarget = [];
		const elements = items.map(item => item.el);
		const type = this.options.isEqualSize && this._renderer._size.item ? CHECK_ONLY_ERROR : CHECK_ALL;
		const prefix = this.options.attributePrefix;

		ImageLoaded.check(elements, {
			prefix,
			type,
			complete: () => {
				if (!this._items) {
					return;
				}
				this._complete(groups, items, isAppend, isUpdate, complete);
			},
			error: ({target, itemIndex}) => {
				if (!this._items) {
					return;
				}
				this._error(removeTarget, replaceTarget, target, items, itemIndex, error);
			},
			end: () => {
				if (!this._items) {
					return;
				}
				this._end(removeTarget, replaceTarget, items, end);
			},
		});
	}
	append({groups, items, isUpdate}, callbacks = {}) {
		this._insert({groups, items, isUpdate, isAppend: true}, callbacks);
	}
	prepend({groups, items, isUpdate}, callbacks = {}) {
		this._insert({groups, items, isUpdate, isAppend: false}, callbacks);
	}
	layout(isRelayout, groups, items) {
		const renderer = this._renderer;
		const {isConstantSize} = renderer.options;
		const layoutGroups = groups.filter(group => {
			const item = group.items[0];

			return item.orgSize && item.rect.top > DUMMY_POSITION / 10;
		});
		let outline = layoutGroups[0].outlines.start;

		if (isRelayout) {
			outline = [outline.length ? Math.min(...outline) : 0];
			if (!isConstantSize && items.length) {
				renderer.updateSize(items);
			}
		}
		this._layout.layout(layoutGroups, outline);
		return this;
	}
	destroy() {
		this._items = null;
		this._renderer = null;
	}
}
