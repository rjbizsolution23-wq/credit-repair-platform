import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = 'all';
  
  categories = [
    { id: 'all', name: 'All Categories', icon: '📋' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'credit-repair', name: 'Credit Repair Process', icon: '🔧' },
    { id: 'legal', name: 'Legal & Compliance', icon: '⚖️' },
    { id: 'billing', name: 'Billing & Payments', icon: '💳' },
    { id: 'platform', name: 'Platform Usage', icon: '💻' },
    { id: 'results', name: 'Results & Timeline', icon: '📈' }
  ];

  faqs = [
    {
      id: 1,
      question: 'How does the 10 Step Total Enforcement Chain™ work?',
      answer: 'Our proprietary 10 Step Total Enforcement Chain™ is a comprehensive credit repair methodology that follows FCRA guidelines. It includes credit report analysis, strategic dispute letter creation, bureau communication, furnisher challenges, and legal enforcement when necessary. Each step is designed to maximize your chances of removing inaccurate, incomplete, or unverifiable information from your credit reports.',
      category: 'credit-repair',
      tags: ['methodology', 'process', 'fcra'],
      expanded: false
    },
    {
      id: 2,
      question: 'How long does credit repair typically take?',
      answer: 'Credit repair timelines vary based on individual circumstances. Most clients see initial results within 30-45 days, with significant improvements typically occurring within 3-6 months. Complex cases may take longer. We provide regular progress updates and work diligently to achieve results as quickly as possible while maintaining compliance with all applicable laws.',
      category: 'results',
      tags: ['timeline', 'results', 'expectations'],
      expanded: false
    },
    {
      id: 3,
      question: 'What makes Rick Jefferson Solutions different from other credit repair companies?',
      answer: 'We are trusted by NFL athletes and Dallas Cowboys players, demonstrating our elite-level service. Our 10 Step Total Enforcement Chain™ is a proprietary methodology that goes beyond basic dispute letters. We combine legal expertise, advanced technology, and personalized service. Our team includes legal professionals who understand FCRA, FDCPA, and other relevant laws.',
      category: 'getting-started',
      tags: ['difference', 'methodology', 'expertise'],
      expanded: false
    },
    {
      id: 4,
      question: 'Can you guarantee specific credit score increases?',
      answer: 'No ethical credit repair company can guarantee specific score increases or promise to remove accurate information. We work to remove inaccurate, incomplete, or unverifiable items from your credit reports. Results vary based on individual circumstances, and we cannot predict exact outcomes. We focus on compliance and ethical practices while working diligently for the best possible results.',
      category: 'legal',
      tags: ['guarantees', 'compliance', 'ethics'],
      expanded: false
    },
    {
      id: 5,
      question: 'How much does credit repair cost?',
      answer: 'Our pricing is transparent and competitive. We offer different service levels to meet various needs and budgets. Contact us for a free consultation to discuss pricing options. We believe in providing value through results, not just promises. All fees are clearly disclosed upfront with no hidden costs.',
      category: 'billing',
      tags: ['pricing', 'cost', 'consultation'],
      expanded: false
    },
    {
      id: 6,
      question: 'How do I upload my credit reports securely?',
      answer: 'Use our secure document upload feature in your client portal. We use bank-level encryption to protect your sensitive information. You can upload PDF files of your credit reports from all three bureaus (Experian, Equifax, TransUnion). Our system automatically processes and analyzes your reports for potential disputes.',
      category: 'platform',
      tags: ['upload', 'security', 'documents'],
      expanded: false
    },
    {
      id: 7,
      question: 'What laws govern credit repair?',
      answer: 'Credit repair is governed by several federal laws including the Fair Credit Reporting Act (FCRA), Credit Repair Organizations Act (CROA), Fair Debt Collection Practices Act (FDCPA), and Fair Credit Billing Act (FCBA). We ensure all our practices comply with these laws and maintain the highest ethical standards in the industry.',
      category: 'legal',
      tags: ['fcra', 'croa', 'fdcpa', 'compliance'],
      expanded: false
    },
    {
      id: 8,
      question: 'Can I dispute items myself instead of hiring a company?',
      answer: 'Yes, you have the right to dispute items yourself. However, effective credit repair requires knowledge of consumer protection laws, proper dispute strategies, and understanding of credit bureau procedures. Our expertise, proven methodology, and legal backing often achieve better results than individual efforts. We handle the complex process so you can focus on your life.',
      category: 'getting-started',
      tags: ['diy', 'professional', 'expertise'],
      expanded: false
    },
    {
      id: 9,
      question: 'How often will I receive updates on my case?',
      answer: 'We provide regular updates through your client portal, including progress reports, dispute results, and next steps. You will receive notifications when we receive responses from credit bureaus or furnishers. Our team is also available for questions and consultations throughout the process.',
      category: 'platform',
      tags: ['updates', 'communication', 'portal'],
      expanded: false
    },
    {
      id: 10,
      question: 'What happens if items are not removed?',
      answer: 'If initial disputes are unsuccessful, we escalate using our 10 Step Total Enforcement Chain™. This may include furnisher disputes, CFPB complaints, state attorney general complaints, and when appropriate, legal action. We exhaust all available remedies while maintaining compliance with applicable laws.',
      category: 'credit-repair',
      tags: ['escalation', 'legal', 'enforcement'],
      expanded: false
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  get filteredFaqs() {
    let filtered = this.faqs;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  toggleFaq(faq: any): void {
    faq.expanded = !faq.expanded;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  getCategoryById(categoryId: string) {
    return this.categories.find(cat => cat.id === categoryId);
  }

  getFaqCountByCategory(categoryId: string): number {
    return this.faqs.filter(faq => faq.category === categoryId).length;
  }
}