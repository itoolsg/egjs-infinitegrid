import { Renderer, RendererItem } from "./Renderer";

export class VanillaRenderer<T extends RendererItem = RendererItem> extends Renderer<T> {
  public render(nextItems: T[]) {
    const container = this.container!;
    const result = this.syncItems(nextItems);
    const {
      prevList,
      removed,
      ordered,
      added,
    } = result;
    const diffList = [...prevList];

    removed.forEach((index) => {
      diffList.splice(index, 1);
      container.removeChild(prevList[index].element!);
    });
    ordered.forEach(([prevIndex, nextIndex]) => {
      const item = diffList.splice(prevIndex, 1)[0];

      diffList.splice(nextIndex, 0, item);
      container.insertBefore(item.element!, diffList[nextIndex + 1]?.element ?? null);
    });
    added.forEach((index) => {
      const item = nextItems[index];

      diffList.splice(index, 0, item);
      container.insertBefore(item.element!, diffList[index + 1]?.element ?? null);
    });

    this.updated(container.children);
    return result;
  }
  public update() {
    return true;
  }
}