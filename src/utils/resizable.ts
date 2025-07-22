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
  snapPoints: number[] = [];
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

    // Only calculate snap points if snap is enabled
    const snap = getCssVar<ResizableTypes.Snap>({
      cssVar: `--${Resizable.CLASS_PREFIX}-snap`,
      element: this.el.container,
    });
    
    if (snap) {
      this.snapPoints = parsePercentages({
        total: /* this.el.container[clientDimension] */1000,
        percentage: 20,
        startAt: this.handleDimension,
      });
    }

    this.debug().init();

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
        snap: getCssVar<ResizableTypes.Snap>({
          cssVar: `--${Resizable.CLASS_PREFIX}-snap`,
          element: this.el.container,
        }),
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
          // Only update debug if debug is enabled
          if (this.isDebug) {
            this.debug().update();
          }
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

  /**
   * Debug
   *
   * @returns Debug callbacks
   */
  debug() {
    return {
      init: () => {
        this.el.debug =
          this.el.container.getElementsByClassName(
            'resizable__debug'
          )?.[0] ?? null;
        this.isDebug = this.el.debug !== null;
        this.debug().render();
      },
      update: () => {
        if (!this.el.debug || !this.isDebug) {
          return;
        }
        const update = JSON.stringify(this.data, null, 2);
        // If no child nodes, add a pre element
        if (this.el.debug.firstChild) {
          this.el.debug.firstChild.textContent = update;
        }
      },
      render: () => {
        if (!this.el.debug) {
          return;
        }
        // Build snap points
        // if (
        //   this.el.container.getElementsByClassName(
        //     'resizable__debug-snap-point'
        //   ).length === 0
        // ) {
        //   for (let i = 0, m = this.snapPoints.length; i < m; i++) {
        //     const point = document.createElement('hr');
        //     point.classList.add('resizable__debug-snap-point');
        //     // @TODO Custom
        //     const position = this.direction === 'x' ? 'left' : 'bottom';
        //     point.style[position] = `${this.snapPoints[i]}px`;
        //     this.el.container.append(point);
        //   }
        // }
        console.log(this.el.debug?.children, this.el.debug?.childNodes);
        // First add a pre element to house updates
        this.el.debug.appendChild(document.createElement('PRE'));

        // Then add a checkbox to toggle debug
        const toggleDebugElement = document.createElement(
          'INPUT'
        ) as HTMLInputElement;
        toggleDebugElement.type = 'checkbox';
        toggleDebugElement.checked = true;
        toggleDebugElement.addEventListener('change', e => {
          console.log('Do stuff with change', e);
          this.isDebug = !this.isDebug;
        });

        this.el.debug.appendChild(toggleDebugElement);
      },
    };
  }

  initialiseResize(e: PointerEvent) {
    e.stopPropagation();
    this.data.hasInteracted ||= this.hasInteracted();

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

    // Only calculate percentage if snap points exist and snap is enabled
    if (this.data.snap && this.snapPoints.length > 0) {
      for (let i = 0; i < this.snapPoints.length; i++) {
        if (
          dimension >= this.snapPoints[i] &&
          (i === this.snapPoints.length - 1 || dimension < this.snapPoints[i + 1])
        ) {
          this.data.currentPercentage = i;
          break;
        }
      }
    }

    const cssDimension = this.direction === 'x' ? 'width' : 'height';

    // Apply dimension immediately to the container (not the resizer)
    if (dimension < this.data.minDimension) {
      (this.el.container as HTMLElement).style[cssDimension] = `${this.data.minDimension}px`;
      this.onResize?.(this.data.minDimension);
    } else if (dimension > this.data.maxDimension) {
      (this.el.container as HTMLElement).style[cssDimension] = `${this.data.maxDimension}px`;
      this.onResize?.(this.data.maxDimension);
    } else {
      (this.el.container as HTMLElement).style[cssDimension] = `${dimension}px`;
      this.onResize?.(dimension);
    }
  }

  /**
   * Method for handling the stop of the resize, and animating to closest|next snap point
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
      if (this.data.snap) {
        let snapTo: number = this.data.currentDimension;
        if (this.data.snap === 'closest') {
          snapTo = this.snapPoints.reduce((prev, curr) =>
            Math.abs(curr - this.data.currentDimension) <
            Math.abs(prev - this.data.currentDimension)
              ? curr
              : prev
          );
        } else if (this.data.snap === 'next') {
          const isUp = this.data.currentDimension > this.data.prevDimension;
          snapTo =
            this.snapPoints[
              isUp
                ? this.data.currentPercentage + 1
                : this.data.currentPercentage
            ];
        }
        const cssDimension = this.direction === 'x' ? 'width' : 'height';
        (this.el.container as HTMLElement).style[cssDimension] = `${snapTo}px`;
        this.data.currentDimension = snapTo;
      }
    }
    window.removeEventListener('pointermove', this.resize);
  }

  destroy() {
    console.log('destroy');
    this.el.body.classList.remove(Resizable.ACTIVE_BODY_CLASS);
    window.removeEventListener('pointermove', this.resize);
    window.removeEventListener('pointerup', this.stopResize);
    this.el.body.removeEventListener('pointerleave', this.stopResize);
  }
}

// const [resizerContainer] = document.getElementsByClassName(Resizable.CLASS_PREFIX);
// new Resizable(resizerContainer);
