import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormFieldConfig, ValidationError } from '../../models/shared.models';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true
    }
  ]
})
export class FormFieldComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'datetime-local' | 'time' | 'color' = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() multiple: boolean = false;
  @Input() options: { value: any; label: string; disabled?: boolean }[] = [];
  @Input() config: FormFieldConfig = {
    showLabel: true,
    showRequiredIndicator: true,
    showHelpText: true,
    showErrorMessages: true,
    showCharacterCount: false,
    floatingLabel: false,
    inline: false,
    compact: false
  };
  @Input() helpText: string = '';
  @Input() errorMessages: ValidationError[] = [];
  @Input() customClass: string = '';
  @Input() maxLength: number | null = null;
  @Input() minLength: number | null = null;
  @Input() min: number | string | null = null;
  @Input() max: number | string | null = null;
  @Input() step: number | string | null = null;
  @Input() pattern: string | null = null;
  @Input() autocomplete: string = '';
  @Input() accept: string = '';
  @Input() rows: number = 3;
  @Input() cols: number | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'default' | 'outlined' | 'filled' | 'underlined' = 'default';
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() clearable: boolean = false;
  @Input() loading: boolean = false;
  @Input() control: AbstractControl | null = null;

  @Output() valueChange = new EventEmitter<any>();
  @Output() blur = new EventEmitter<Event>();
  @Output() focus = new EventEmitter<Event>();
  @Output() keyup = new EventEmitter<KeyboardEvent>();
  @Output() keydown = new EventEmitter<KeyboardEvent>();
  @Output() iconClick = new EventEmitter<Event>();
  @Output() clearClick = new EventEmitter<Event>();
  @Output() fileSelect = new EventEmitter<FileList>();

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  value: any = '';
  focused: boolean = false;
  touched: boolean = false;
  showPassword: boolean = false;
  characterCount: number = 0;

  ngOnInit(): void {
    if (this.control) {
      this.control.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateErrorMessages();
        });

      this.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value) => {
          this.value = value;
          this.updateCharacterCount();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
    this.updateCharacterCount();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    let value = target.value;

    if (this.type === 'number') {
      value = target.value ? parseFloat(target.value) : null;
    } else if (this.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    } else if (this.type === 'file') {
      const files = (target as HTMLInputElement).files;
      value = this.multiple ? files : files?.[0] || null;
      if (files) {
        this.fileSelect.emit(files);
      }
    }

    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
    this.updateCharacterCount();
  }

  onFocus(event: Event): void {
    this.focused = true;
    this.focus.emit(event);
  }

  onBlur(event: Event): void {
    this.focused = false;
    this.touched = true;
    this.onTouched();
    this.blur.emit(event);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.keyup.emit(event);
  }

  onKeyDown(event: KeyboardEvent): void {
    this.keydown.emit(event);
  }

  onIconClick(event: Event): void {
    if (this.type === 'password') {
      this.togglePasswordVisibility();
    }
    this.iconClick.emit(event);
  }

  onClearClick(event: Event): void {
    event.stopPropagation();
    this.value = this.type === 'number' ? null : '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.clearClick.emit(event);
    this.updateCharacterCount();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  updateCharacterCount(): void {
    if (this.config.showCharacterCount && typeof this.value === 'string') {
      this.characterCount = this.value.length;
    }
  }

  updateErrorMessages(): void {
    if (this.control && this.control.errors) {
      this.errorMessages = Object.keys(this.control.errors).map(key => ({
        type: key,
        message: this.getErrorMessage(key, this.control!.errors![key])
      }));
    } else {
      this.errorMessages = [];
    }
  }

  getErrorMessage(errorType: string, errorValue: any): string {
    switch (errorType) {
      case 'required':
        return `${this.label || 'This field'} is required`;
      case 'email':
        return 'Please enter a valid email address';
      case 'minlength':
        return `Minimum length is ${errorValue.requiredLength} characters`;
      case 'maxlength':
        return `Maximum length is ${errorValue.requiredLength} characters`;
      case 'min':
        return `Minimum value is ${errorValue.min}`;
      case 'max':
        return `Maximum value is ${errorValue.max}`;
      case 'pattern':
        return 'Please enter a valid format';
      default:
        return 'Invalid input';
    }
  }

  getFieldClasses(): string {
    const classes = ['form-field'];

    // Size
    classes.push(`form-field-${this.size}`);

    // Variant
    classes.push(`form-field-${this.variant}`);

    // State classes
    if (this.focused) {
      classes.push('form-field-focused');
    }

    if (this.disabled) {
      classes.push('form-field-disabled');
    }

    if (this.readonly) {
      classes.push('form-field-readonly');
    }

    if (this.hasError()) {
      classes.push('form-field-error');
    }

    if (this.loading) {
      classes.push('form-field-loading');
    }

    // Configuration classes
    if (this.config.floatingLabel) {
      classes.push('form-field-floating');
    }

    if (this.config.inline) {
      classes.push('form-field-inline');
    }

    if (this.config.compact) {
      classes.push('form-field-compact');
    }

    // Icon classes
    if (this.icon) {
      classes.push(`form-field-icon-${this.iconPosition}`);
    }

    // Custom classes
    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  getInputClasses(): string {
    const classes = ['form-control'];

    if (this.hasError()) {
      classes.push('is-invalid');
    }

    return classes.join(' ');
  }

  getInputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  getPasswordIcon(): string {
    return this.showPassword ? 'feather icon-eye-off' : 'feather icon-eye';
  }

  hasError(): boolean {
    return this.errorMessages.length > 0 || (this.control?.invalid && this.control?.touched) || false;
  }

  hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  shouldShowLabel(): boolean {
    return this.config.showLabel && !!this.label;
  }

  shouldShowRequiredIndicator(): boolean {
    return this.config.showRequiredIndicator && this.required;
  }

  shouldShowHelpText(): boolean {
    return this.config.showHelpText && !!this.helpText && !this.hasError();
  }

  shouldShowErrorMessages(): boolean {
    return this.config.showErrorMessages && this.hasError();
  }

  shouldShowCharacterCount(): boolean {
    return this.config.showCharacterCount && this.maxLength !== null && typeof this.value === 'string';
  }

  shouldShowClearButton(): boolean {
    return this.clearable && this.hasValue() && !this.disabled && !this.readonly;
  }

  shouldShowIcon(): boolean {
    return !!this.icon || this.type === 'password';
  }

  getDisplayIcon(): string {
    if (this.type === 'password') {
      return this.getPasswordIcon();
    }
    return this.icon;
  }

  getAriaDescribedBy(): string {
    const ids = [];
    
    if (this.shouldShowHelpText()) {
      ids.push(`${this.getFieldId()}-help`);
    }
    
    if (this.shouldShowErrorMessages()) {
      ids.push(`${this.getFieldId()}-error`);
    }
    
    return ids.join(' ');
  }

  getFieldId(): string {
    return `field-${Math.random().toString(36).substr(2, 9)}`;
  }

  isTextInput(): boolean {
    return ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'datetime-local', 'time', 'color'].includes(this.type);
  }

  isTextarea(): boolean {
    return this.type === 'textarea';
  }

  isSelect(): boolean {
    return this.type === 'select';
  }

  isCheckbox(): boolean {
    return this.type === 'checkbox';
  }

  isRadio(): boolean {
    return this.type === 'radio';
  }

  isFile(): boolean {
    return this.type === 'file';
  }
}