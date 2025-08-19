import { parsIntCssVar, getCssVar, parsePercentages } from './parse';
import * as ResizableTypes from '../types/resizer';

const mandatory = (param: string) => {
  throw new Error(`${param} param is missing!`);
};

export class Resizable {
  // Class added to body during resize
  static ACTIVE_BODY_CLASS: string = 'resize-in-progress';

  // Class prefix for the component
  static CLASS_PREFIX: string = 'resizable';

  el: {
    body: HTMLElement; // Class added to body during resize
    container: ResizableTypes.Elem;
    resizer: HTMLElement;
    handle: HTMLElement;
    debug: Element | null;
  };

  data: ResizableTypes.Data;

  // Static
  handleDimension: number;
  direction: ResizableTypes.Direction;
  isDebug: boolean = false;
  onResize?: (dimension: number) => void;
  minDimension: number;

  constructor(
    container: ResizableTypes.Elem = mandatory('container'),
    {
      elementResizer,
      elementHandle,
      onResize,
    }: {
      elementResizer?: HTMLElement;
      elementHandle?: HTMLElement;
      onResize?: (dimension: number) => void;
    } = {}
  ) {
    this.el = {
      body: document.body,
      container,
      resizer:
        elementResizer ??
        (container.getElementsByClassName(
          'resizable__resizer'
        )[0] as HTMLElement),
      handle:
        elementHandle ??
        (container.getElementsByClassName(
          'resizable__resizer-handle'
        )?.[0] as HTMLElement),
      debug: null,
    };

    this.onResize = onResize ?? (() => {});

    this.direction =
      getCssVar<ResizableTypes.Direction>({
        cssVar: `--${Resizable.CLASS_PREFIX}-direction`,
        element: this.el.container,
      }) ?? 'y';

    this.minDimension =
      parsIntCssVar({
        cssVar: `--${Resizable.CLASS_PREFIX}-min-dimension`,
        element: this.el.container,
      }) ?? 250;

    const clientDimension =
      this.direction === 'x' ? 'clientWidth' : 'clientHeight';

    this.handleDimension =
      parsIntCssVar({
        cssVar: `--${Resizable.CLASS_PREFIX}-handle-dimension`,
        element: this.el.container,
      }) ?? this.el.handle[clientDimension];

    const offset = this.handleDimension / 2;

    this.data = new Proxy(
      {
        // @TODO Custom
        currentDimension: 0,
        expanding: false,
        hasInteracted: false,
        minDimension: this.minDimension,
        maxDimension: /* this.el.container[clientDimension] */1000,
        offset,
        prevDimension: 0,
        originalCoordinate: 0,
        originalPointerCoordinate: 0,
        currentPercentage: 0,
        snapThreshold:
          parsIntCssVar({
            cssVar: `--${Resizable.CLASS_PREFIX}-snap-threshold`,
            element: this.el.container,
          }) ?? 0,
      },
      {
        get: (target: ResizableTypes.Data, prop) => {
          return target[prop as keyof typeof target];
        },
        set: (target: ResizableTypes.Data, prop, value) => {
          (target as any)[prop] = value;
          return true;
        },
      }
    );

    /**
     * Add method bindings
     */
    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this.initialiseResize = this.initialiseResize.bind(this);

    /**
     * Bind event listeners
     */
    this.el.handle.addEventListener('pointerdown', this.initialiseResize);
  }

  initialiseResize(e: PointerEvent) {
    if(e.button !== 0) return;
    e.stopPropagation();
    this.data.hasInteracted ||= this.hasInteracted();

    console.log('initialiseResize snapThreshold', this.data.snapThreshold);

    if (!this.el.body.classList.contains(Resizable.ACTIVE_BODY_CLASS)) {
      this.el.body.classList.add(Resizable.ACTIVE_BODY_CLASS);
    }

    const cssDimension = this.direction === 'x' ? 'width' : 'height';
    const coordinate = this.direction === 'x' ? 'left' : 'top';
    const pointerCoordinate = this.direction === 'x' ? 'pageX' : 'pageY';

    this.data.prevDimension = parseFloat(
      getComputedStyle(this.el.container as HTMLElement, null)
        .getPropertyValue(cssDimension)
        .replace('px', '')
    );
    this.data.currentDimension = this.data.prevDimension;
    this.data.originalCoordinate =
      (this.el.container as HTMLElement).getBoundingClientRect()[coordinate];
    this.data.originalPointerCoordinate = e[pointerCoordinate];

    window.addEventListener('pointermove', this.resize);
  }

  /**
   * Check if the user has interacted with the resizer
   *
   * @returns True if the user has interacted with the resizer
   */
  hasInteracted() {
    window.addEventListener('pointerup', this.stopResize);
    this.el.body.addEventListener('pointerleave', this.stopResize);
    return true;
  }

  /**
   * Stop the resize when the pointer is released
   */
  pointerUp() {
    this.stopResize();
  }

  /**
   * Resize listener callback
   *
   * @param {PointerEvent} e Pointer event object
   */
  resize(e: PointerEvent) {
    const pointerCoordinate = this.direction === 'x' ? 'pageX' : 'pageY';
    let dimension: number;
    if (this.direction === 'x') {
      dimension = parseFloat(
        (
          this.data.prevDimension +
          (e[pointerCoordinate] - this.data.originalPointerCoordinate)
        ).toFixed(2)
      );
    } else {
      dimension = parseFloat(
        (
          this.data.prevDimension -
          (e[pointerCoordinate] - this.data.originalPointerCoordinate)
        ).toFixed(2)
      );
    }

    this.data.expanding = this.data.currentDimension < dimension;
    this.data.currentDimension = dimension;

    const cssDimension = this.direction === 'x' ? 'width' : 'height';

    // Apply dimension immediately to the container (not the resizer)
    if (dimension - this.data.minDimension <= this.data.snapThreshold) {
      (this.el.container as HTMLElement).style[cssDimension] = `${this.data.minDimension}px`;
      this.onResize?.(this.data.minDimension);
    } else if (this.data.maxDimension - dimension <= this.data.snapThreshold) {
      (this.el.container as HTMLElement).style[cssDimension] = `${this.data.maxDimension}px`;
      this.onResize?.(this.data.maxDimension);
    } else {
      (this.el.container as HTMLElement).style[cssDimension] = `${dimension}px`;
      this.onResize?.(dimension);
    }
  }

  /**
   * Method for handling the stop of the resize.
   */
  stopResize() {
    if (this.el.body.classList.contains(Resizable.ACTIVE_BODY_CLASS)) {
      this.el.body.classList.remove(Resizable.ACTIVE_BODY_CLASS);
    }
    if (
      +this.data.prevDimension.toFixed(2) !==
      +this.data.currentDimension.toFixed(2)
    ) {
      this.data.prevDimension = parseFloat(
        this.data.currentDimension.toFixed(2)
      );
    }
    window.removeEventListener('pointermove', this.resize);
  }

  destroy() {
    this.el.body.classList.remove(Resizable.ACTIVE_BODY_CLASS);
    window.removeEventListener('pointermove', this.resize);
    window.removeEventListener('pointerup', this.stopResize);
    this.el.body.removeEventListener('pointerleave', this.stopResize);
    this.data.hasInteracted = false;
    this.onResize = undefined;
  }
}
