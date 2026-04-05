/**
 * Screenshot Annotation Editor
 * 
 * Provides a canvas-based editor for annotating screenshots with:
 * - Drawing tools: Arrow, Rectangle, Circle, Pen, Text
 * - Color picker
 * - Undo/redo functionality
 * - Export to PNG
 */

type AnnotationTool = 'arrow' | 'rectangle' | 'circle' | 'pen' | 'text' | 'none';

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  type: AnnotationTool;
  color: string;
  lineWidth: number;
  points?: Point[];
  start?: Point;
  end?: Point;
  text?: string;
}

interface EditorOptions {
  imageDataUrl: string;
  onSave: (annotatedDataUrl: string) => void;
  onCancel: () => void;
}

const EDITOR_ID = '__bugreport_annotation_editor__';
const CANVAS_ID = '__bugreport_annotation_canvas__';

export class AnnotationEditor {
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private image: HTMLImageElement | null = null;
  
  private currentTool: AnnotationTool = 'arrow';
  private currentColor = '#FF0000';
  private lineWidth = 3;
  
  private annotations: Annotation[] = [];
  private currentAnnotation: Annotation | null = null;
  private isDrawing = false;
  private startPoint: Point | null = null;
  
  private onSaveCallback: (dataUrl: string) => void;
  private onCancelCallback: () => void;

  constructor(options: EditorOptions) {
    this.onSaveCallback = options.onSave;
    this.onCancelCallback = options.onCancel;
    this.loadImage(options.imageDataUrl);
  }

  private loadImage(dataUrl: string): void {
    this.image = new Image();
    this.image.onload = () => {
      this.render();
    };
    this.image.src = dataUrl;
  }

  private render(): void {
    if (document.getElementById(EDITOR_ID)) return;

    this.container = document.createElement('div');
    this.container.id = EDITOR_ID;
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(0,0,0,0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Toolbar
    const toolbar = this.createToolbar();
    this.container.appendChild(toolbar);

    // Canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: calc(100% - 120px);
      overflow: auto;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.id = CANVAS_ID;
    this.canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      border: 2px solid #fff;
      cursor: crosshair;
    `;

    if (this.image) {
      this.canvas.width = this.image.width;
      this.canvas.height = this.image.height;
    }

    this.ctx = this.canvas.getContext('2d');
    this.drawCanvas();

    // Event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    canvasContainer.appendChild(this.canvas);
    this.container.appendChild(canvasContainer);

    // Action buttons
    const actions = this.createActions();
    this.container.appendChild(actions);

    document.body.appendChild(this.container);
  }

  private createToolbar(): HTMLDivElement {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      margin-bottom: 16px;
      backdrop-filter: blur(10px);
    `;

    // Tool buttons
    const tools: { tool: AnnotationTool; label: string; icon: string }[] = [
      { tool: 'arrow', label: 'Arrow', icon: '→' },
      { tool: 'rectangle', label: 'Rectangle', icon: '▢' },
      { tool: 'circle', label: 'Circle', icon: '○' },
      { tool: 'pen', label: 'Pen', icon: '✎' },
      { tool: 'text', label: 'Text', icon: 'T' },
    ];

    tools.forEach(({ tool, label, icon }) => {
      const btn = document.createElement('button');
      btn.textContent = `${icon} ${label}`;
      btn.style.cssText = `
        padding: 8px 16px;
        background: ${this.currentTool === tool ? '#e11d48' : 'rgba(255,255,255,0.2)'};
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      `;
      btn.addEventListener('click', () => {
        this.currentTool = tool;
        this.updateToolbarState();
      });
      btn.setAttribute('data-tool', tool);
      toolbar.appendChild(btn);
    });

    // Color picker
    const colorLabel = document.createElement('span');
    colorLabel.textContent = 'Color:';
    colorLabel.style.cssText = 'color: #fff; font-size: 14px; margin-left: 16px;';
    toolbar.appendChild(colorLabel);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.currentColor;
    colorInput.style.cssText = `
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    `;
    colorInput.addEventListener('change', (e) => {
      this.currentColor = (e.target as HTMLInputElement).value;
    });
    toolbar.appendChild(colorInput);

    // Undo button
    const undoBtn = document.createElement('button');
    undoBtn.textContent = '↶ Undo';
    undoBtn.style.cssText = `
      padding: 8px 16px;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 16px;
    `;
    undoBtn.addEventListener('click', () => this.undo());
    toolbar.appendChild(undoBtn);

    return toolbar;
  }

  private createActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: 16px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 12px 24px;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;
    cancelBtn.addEventListener('click', () => this.cancel());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Done';
    saveBtn.style.cssText = `
      padding: 12px 24px;
      background: #e11d48;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;
    saveBtn.addEventListener('click', () => this.save());

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    return actions;
  }

  private updateToolbarState(): void {
    const buttons = this.container?.querySelectorAll('[data-tool]');
    buttons?.forEach((btn) => {
      const tool = btn.getAttribute('data-tool');
      (btn as HTMLElement).style.background =
        tool === this.currentTool ? '#e11d48' : 'rgba(255,255,255,0.2)';
    });
  }

  private getMousePos(e: MouseEvent): Point {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.currentTool === 'none') return;

    this.isDrawing = true;
    this.startPoint = this.getMousePos(e);

    if (this.currentTool === 'text') {
      this.addText(this.startPoint);
      return;
    }

    this.currentAnnotation = {
      type: this.currentTool,
      color: this.currentColor,
      lineWidth: this.lineWidth,
      start: this.startPoint,
      points: this.currentTool === 'pen' ? [this.startPoint] : undefined,
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing || !this.currentAnnotation) return;

    const currentPoint = this.getMousePos(e);

    if (this.currentTool === 'pen' && this.currentAnnotation.points) {
      this.currentAnnotation.points.push(currentPoint);
    } else {
      this.currentAnnotation.end = currentPoint;
    }

    this.drawCanvas();
    this.drawCurrentAnnotation();
  }

  private handleMouseUp(): void {
    if (!this.isDrawing) return;

    if (this.currentAnnotation && this.currentTool !== 'text') {
      this.annotations.push({ ...this.currentAnnotation });
    }

    this.isDrawing = false;
    this.currentAnnotation = null;
    this.drawCanvas();
  }

  private addText(point: Point): void {
    const text = prompt('Enter text:');
    if (!text) {
      this.isDrawing = false;
      return;
    }

    const annotation: Annotation = {
      type: 'text',
      color: this.currentColor,
      lineWidth: this.lineWidth,
      start: point,
      text,
    };

    this.annotations.push(annotation);
    this.isDrawing = false;
    this.drawCanvas();
  }

  private drawCanvas(): void {
    if (!this.ctx || !this.canvas || !this.image) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw image
    this.ctx.drawImage(this.image, 0, 0);

    // Draw all annotations
    this.annotations.forEach((annotation) => this.drawAnnotation(annotation));
  }

  private drawCurrentAnnotation(): void {
    if (!this.currentAnnotation) return;
    this.drawAnnotation(this.currentAnnotation);
  }

  private drawAnnotation(annotation: Annotation): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = annotation.color;
    this.ctx.fillStyle = annotation.color;
    this.ctx.lineWidth = annotation.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    switch (annotation.type) {
      case 'arrow':
        if (annotation.start && annotation.end) {
          this.drawArrow(annotation.start, annotation.end);
        }
        break;

      case 'rectangle':
        if (annotation.start && annotation.end) {
          this.drawRectangle(annotation.start, annotation.end);
        }
        break;

      case 'circle':
        if (annotation.start && annotation.end) {
          this.drawCircle(annotation.start, annotation.end);
        }
        break;

      case 'pen':
        if (annotation.points && annotation.points.length > 1) {
          this.drawPen(annotation.points);
        }
        break;

      case 'text':
        if (annotation.start && annotation.text) {
          this.drawText(annotation.start, annotation.text);
        }
        break;
    }
  }

  private drawArrow(start: Point, end: Point): void {
    if (!this.ctx) return;

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawRectangle(start: Point, end: Point): void {
    if (!this.ctx) return;

    const width = end.x - start.x;
    const height = end.y - start.y;

    this.ctx.beginPath();
    this.ctx.rect(start.x, start.y, width, height);
    this.ctx.stroke();
  }

  private drawCircle(start: Point, end: Point): void {
    if (!this.ctx) return;

    const radius = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private drawPen(points: Point[]): void {
    if (!this.ctx || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();
  }

  private drawText(point: Point, text: string): void {
    if (!this.ctx) return;

    this.ctx.font = '24px sans-serif';
    this.ctx.fillText(text, point.x, point.y);
  }

  private undo(): void {
    this.annotations.pop();
    this.drawCanvas();
  }

  private save(): void {
    if (!this.canvas) return;

    const dataUrl = this.canvas.toDataURL('image/png');
    this.onSaveCallback(dataUrl);
    this.destroy();
  }

  private cancel(): void {
    this.onCancelCallback();
    this.destroy();
  }

  private destroy(): void {
    this.container?.remove();
    this.container = null;
    this.canvas = null;
    this.ctx = null;
  }
}

export function openAnnotationEditor(options: EditorOptions): AnnotationEditor {
  return new AnnotationEditor(options);
}
