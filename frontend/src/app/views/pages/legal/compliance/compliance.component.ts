import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent implements OnInit {
  mode: string = 'default';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] || 'default';
  }
}