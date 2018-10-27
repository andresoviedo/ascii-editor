//------------------------------------------------- CANVAS CLASS ----------------------------------------------------//

class CanvasEvents {
  private handlers: Record<string,Function[]> = {};

  triggerResize = () => this.doTrigger('Resize', undefined);
  onResize = (f: () => void) => this.addHandler('Resize', f);

  triggerKeyDown = (evt: JQuery.Event) => this.doTrigger('KeyDown', evt);
  onKeyDown = (f: (evt: JQuery.Event) => void) => this.addHandler('KeyDown', f);

  triggerKeyPress = (evt: JQuery.Event) => this.doTrigger('KeyPress', evt);
  onKeyPress = (f: (evt: JQuery.Event) => void) => this.addHandler('KeyPress', f);

  triggerKeyUp = (evt: JQuery.Event) => this.doTrigger('KeyUp', evt);
  onKeyUp = (f: (evt: JQuery.Event) => void) => this.addHandler('KeyUp', f);

  triggerMouseWheel = (evt: JQuery.Event) => this.doTrigger('MouseWheel', evt);
  onMouseWheel = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseWheel', f);

  triggerMouseUp = (evt: JQuery.Event) => this.doTrigger('MouseUp', evt);
  onMouseUp = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseUp', f);

  triggerMouseDown = (evt: JQuery.Event) => this.doTrigger('MouseDown', evt);
  onMouseDown = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseDown', f);

  triggerMouseEnter = (evt: JQuery.Event) => this.doTrigger('MouseEnter', evt);
  onMouseEnter = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseEnter', f);

  triggerMouseMove = (evt: JQuery.Event) => this.doTrigger('MouseMove', evt);
  onMouseMove = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseMove', f);

  triggerMouseLeave = (evt: JQuery.Event) => this.doTrigger('MouseLeave', evt);
  onMouseLeave = (f: (evt: JQuery.Event) => void) => this.addHandler('MouseLeave', f);

  triggerCellDown = (coord: Coord) => this.doTrigger('CellDown', coord);
  onCellDown = (f: (coord: Coord) => void) => this.addHandler('CellDown', f);

  triggerCellMove = (coord: Coord) => this.doTrigger('CellMove', coord);
  onCellMove = (f: (coord: Coord) => void) => this.addHandler('CellMove', f);

  triggerCellUp = (coord: Coord) => this.doTrigger('CellUp', coord);
  onCellUp = (f: (coord: Coord) => void) => this.addHandler('CellUp', f);

  private doTrigger(name:string, arg:any){
    let namedHandlers = this.handlers[name];
    if(namedHandlers){
      for(let i = 0; i < namedHandlers.length; i++){
        namedHandlers[i](arg);
      }
    }
  }

  private addHandler(name:string, f: Function){
    let namedHandlers = this.handlers[name];
    if(!namedHandlers){
      namedHandlers = this.handlers[name] = [];
    }
    namedHandlers.push(f);
  }
}
