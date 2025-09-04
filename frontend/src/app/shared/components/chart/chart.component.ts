import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ChartConfig, ChartData, ChartOptions } from '../../models/shared.models';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble' = 'line';
  @Input() data: ChartData = { labels: [], datasets: [] };
  @Input() options: ChartOptions = {};
  @Input() config: ChartConfig = {
    responsive: true,
    maintainAspectRatio: true,
    showLegend: true,
    showTooltips: true,
    showGridLines: true,
    showAxes: true,
    animated: true,
    exportable: false,
    zoomable: false,
    pannable: false
  };
  @Input() width: number | string = '100%';
  @Input() height: number | string = 'auto';
  @Input() customClass: string = '';
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() noDataMessage: string = 'No data available';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() theme: 'light' | 'dark' | 'auto' = 'auto';

  @Output() chartClick = new EventEmitter<any>();
  @Output() chartHover = new EventEmitter<any>();
  @Output() legendClick = new EventEmitter<any>();
  @Output() dataPointClick = new EventEmitter<any>();
  @Output() chartReady = new EventEmitter<any>();
  @Output() chartError = new EventEmitter<string>();
  @Output() exportClick = new EventEmitter<string>();

  chart: any = null;
  chartId: string = '';
  isReady: boolean = false;
  hasData: boolean = false;
  currentTheme: 'light' | 'dark' = 'light';

  // Color palettes
  private colorPalettes = {
    light: {
      primary: ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c'],
      background: ['rgba(0, 123, 255, 0.1)', 'rgba(108, 117, 125, 0.1)', 'rgba(40, 167, 69, 0.1)', 'rgba(220, 53, 69, 0.1)', 'rgba(255, 193, 7, 0.1)', 'rgba(23, 162, 184, 0.1)', 'rgba(111, 66, 193, 0.1)', 'rgba(232, 62, 140, 0.1)'],
      text: '#495057',
      grid: '#e9ecef',
      background_color: '#ffffff'
    },
    dark: {
      primary: ['#4dabf7', '#868e96', '#51cf66', '#ff6b6b', '#ffd43b', '#22b8cf', '#9775fa', '#f783ac'],
      background: ['rgba(77, 171, 247, 0.1)', 'rgba(134, 142, 150, 0.1)', 'rgba(81, 207, 102, 0.1)', 'rgba(255, 107, 107, 0.1)', 'rgba(255, 212, 59, 0.1)', 'rgba(34, 184, 207, 0.1)', 'rgba(151, 117, 250, 0.1)', 'rgba(247, 131, 172, 0.1)'],
      text: '#e9ecef',
      grid: '#495057',
      background_color: '#2d3748'
    }
  };

  ngOnInit(): void {
    this.chartId = this.generateChartId();
    this.detectTheme();
    this.checkHasData();
  }

  ngAfterViewInit(): void {
    if (this.hasData && !this.loading && !this.error) {
      this.initializeChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private generateChartId(): string {
    return `chart-${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectTheme(): void {
    if (this.theme === 'auto') {
      this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      this.currentTheme = this.theme;
    }
  }

  private checkHasData(): void {
    this.hasData = this.data && this.data.datasets && this.data.datasets.length > 0;
  }

  private async initializeChart(): Promise<void> {
    try {
      // Note: In a real implementation, you would import Chart.js here
      // For this example, we'll simulate chart creation
      await this.createChart();
      this.isReady = true;
      this.chartReady.emit(this.chart);
    } catch (error) {
      console.error('Chart initialization error:', error);
      this.error = 'Failed to initialize chart';
      this.chartError.emit(this.error);
    }
  }

  private async createChart(): Promise<void> {
    // Simulate chart creation
    // In a real implementation, this would use Chart.js or another charting library
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const chartOptions = this.buildChartOptions();
    const chartData = this.processChartData();

    // Simulate chart instance
    this.chart = {
      type: this.type,
      data: chartData,
      options: chartOptions,
      canvas: this.chartCanvas.nativeElement,
      ctx: ctx,
      destroy: () => {
        // Cleanup logic
      },
      update: () => {
        // Update logic
      },
      resize: () => {
        // Resize logic
      },
      toBase64Image: () => {
        return this.chartCanvas.nativeElement.toDataURL();
      }
    };

    // Draw a simple placeholder chart
    this.drawPlaceholderChart(ctx);
  }

  private buildChartOptions(): any {
    const palette = this.colorPalettes[this.currentTheme];
    
    const defaultOptions = {
      responsive: this.config.responsive,
      maintainAspectRatio: this.config.maintainAspectRatio,
      animation: {
        duration: this.config.animated ? 1000 : 0
      },
      plugins: {
        legend: {
          display: this.config.showLegend,
          labels: {
            color: palette.text
          }
        },
        tooltip: {
          enabled: this.config.showTooltips,
          backgroundColor: palette.background_color,
          titleColor: palette.text,
          bodyColor: palette.text,
          borderColor: palette.grid,
          borderWidth: 1
        }
      },
      scales: this.buildScalesOptions(palette),
      onClick: (event: any, elements: any[]) => {
        this.chartClick.emit({ event, elements });
        if (elements.length > 0) {
          this.dataPointClick.emit(elements[0]);
        }
      },
      onHover: (event: any, elements: any[]) => {
        this.chartHover.emit({ event, elements });
      }
    };

    return { ...defaultOptions, ...this.options };
  }

  private buildScalesOptions(palette: any): any {
    if (!this.config.showAxes) {
      return {};
    }

    const scaleOptions = {
      grid: {
        display: this.config.showGridLines,
        color: palette.grid
      },
      ticks: {
        color: palette.text
      }
    };

    if (['line', 'bar', 'scatter', 'bubble'].includes(this.type)) {
      return {
        x: scaleOptions,
        y: scaleOptions
      };
    }

    return {};
  }

  private processChartData(): any {
    const palette = this.colorPalettes[this.currentTheme];
    const processedData = { ...this.data };

    // Apply colors to datasets if not provided
    processedData.datasets = processedData.datasets.map((dataset, index) => {
      const colorIndex = index % palette.primary.length;
      
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || palette.background[colorIndex],
        borderColor: dataset.borderColor || palette.primary[colorIndex],
        borderWidth: dataset.borderWidth || 2
      };
    });

    return processedData;
  }

  private drawPlaceholderChart(ctx: CanvasRenderingContext2D): void {
    const canvas = this.chartCanvas.nativeElement;
    const palette = this.colorPalettes[this.currentTheme];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = palette.background_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder based on chart type
    switch (this.type) {
      case 'line':
        this.drawLinePlaceholder(ctx, palette);
        break;
      case 'bar':
        this.drawBarPlaceholder(ctx, palette);
        break;
      case 'pie':
      case 'doughnut':
        this.drawPiePlaceholder(ctx, palette);
        break;
      default:
        this.drawGenericPlaceholder(ctx, palette);
    }
  }

  private drawLinePlaceholder(ctx: CanvasRenderingContext2D, palette: any): void {
    const canvas = this.chartCanvas.nativeElement;
    const margin = 40;
    const width = canvas.width - margin * 2;
    const height = canvas.height - margin * 2;
    
    // Draw axes
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw sample line
    ctx.strokeStyle = palette.primary[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin - 20);
    ctx.lineTo(margin + width * 0.3, canvas.height - margin - 60);
    ctx.lineTo(margin + width * 0.6, canvas.height - margin - 40);
    ctx.lineTo(margin + width, canvas.height - margin - 80);
    ctx.stroke();
  }

  private drawBarPlaceholder(ctx: CanvasRenderingContext2D, palette: any): void {
    const canvas = this.chartCanvas.nativeElement;
    const margin = 40;
    const barCount = 5;
    const barWidth = (canvas.width - margin * 2) / barCount * 0.8;
    const barSpacing = (canvas.width - margin * 2) / barCount * 0.2;
    
    for (let i = 0; i < barCount; i++) {
      const x = margin + i * (barWidth + barSpacing);
      const height = Math.random() * (canvas.height - margin * 2) * 0.8;
      const y = canvas.height - margin - height;
      
      ctx.fillStyle = palette.primary[i % palette.primary.length];
      ctx.fillRect(x, y, barWidth, height);
    }
  }

  private drawPiePlaceholder(ctx: CanvasRenderingContext2D, palette: any): void {
    const canvas = this.chartCanvas.nativeElement;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    const segments = 4;
    
    let currentAngle = 0;
    for (let i = 0; i < segments; i++) {
      const segmentAngle = (Math.PI * 2) / segments;
      
      ctx.fillStyle = palette.primary[i % palette.primary.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += segmentAngle;
    }
    
    // Draw inner circle for doughnut
    if (this.type === 'doughnut') {
      ctx.fillStyle = palette.background_color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGenericPlaceholder(ctx: CanvasRenderingContext2D, palette: any): void {
    const canvas = this.chartCanvas.nativeElement;
    
    ctx.fillStyle = palette.text;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Chart Placeholder', canvas.width / 2, canvas.height / 2);
  }

  private destroyChart(): void {
    if (this.chart && typeof this.chart.destroy === 'function') {
      this.chart.destroy();
      this.chart = null;
    }
  }

  updateChart(): void {
    if (this.chart) {
      this.chart.data = this.processChartData();
      this.chart.options = this.buildChartOptions();
      if (typeof this.chart.update === 'function') {
        this.chart.update();
      }
    } else {
      this.initializeChart();
    }
  }

  resizeChart(): void {
    if (this.chart && typeof this.chart.resize === 'function') {
      this.chart.resize();
    }
  }

  exportChart(format: 'png' | 'jpg' | 'pdf' = 'png'): void {
    if (this.chart && typeof this.chart.toBase64Image === 'function') {
      const dataUrl = this.chart.toBase64Image();
      this.downloadImage(dataUrl, `chart.${format}`);
      this.exportClick.emit(format);
    }
  }

  private downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onLegendClick(event: Event): void {
    this.legendClick.emit(event);
  }

  getChartClasses(): string {
    const classes = ['chart-container'];
    
    if (this.loading) {
      classes.push('chart-loading');
    }
    
    if (this.error) {
      classes.push('chart-error');
    }
    
    if (!this.hasData) {
      classes.push('chart-no-data');
    }
    
    if (this.customClass) {
      classes.push(this.customClass);
    }
    
    classes.push(`chart-theme-${this.currentTheme}`);
    
    return classes.join(' ');
  }

  getCanvasStyles(): any {
    return {
      width: typeof this.width === 'number' ? `${this.width}px` : this.width,
      height: typeof this.height === 'number' ? `${this.height}px` : this.height,
      maxWidth: '100%'
    };
  }

  shouldShowChart(): boolean {
    return this.hasData && !this.loading && !this.error;
  }

  shouldShowLoading(): boolean {
    return this.loading;
  }

  shouldShowError(): boolean {
    return !!this.error;
  }

  shouldShowNoData(): boolean {
    return !this.hasData && !this.loading && !this.error;
  }

  shouldShowTitle(): boolean {
    return !!this.title;
  }

  shouldShowSubtitle(): boolean {
    return !!this.subtitle;
  }

  shouldShowExportButton(): boolean {
    return this.config.exportable && this.isReady && this.hasData;
  }
}