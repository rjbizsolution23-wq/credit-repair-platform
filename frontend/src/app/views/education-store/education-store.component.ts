import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  studentsEnrolled: number;
  thumbnail: string;
  lessons: number;
  isPopular?: boolean;
  isFree?: boolean;
  tags: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: 'books' | 'templates' | 'software' | 'consultation' | 'tools';
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  isDigital: boolean;
  isBestseller?: boolean;
  features: string[];
  downloadable?: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: Date;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  isPopular?: boolean;
}

@Component({
  selector: 'app-education-store',
  templateUrl: './education-store.component.html',
  styleUrls: ['./education-store.component.scss']
})
export class EducationStoreComponent implements OnInit {
  activeTab: 'courses' | 'store' | 'articles' = 'courses';
  
  // Courses data
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  
  // Store products data
  products: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Articles data
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  
  // Filters
  searchTerm: string = '';
  categoryFilter: string = 'all';
  priceFilter: string = 'all';
  levelFilter: string = 'all';
  
  // Loading states
  isLoading: boolean = false;
  
  // Cart
  cartItems: any[] = [];
  cartTotal: number = 0;
  
  // Statistics
  stats = {
    totalCourses: 0,
    totalProducts: 0,
    totalArticles: 0,
    totalStudents: 0,
    avgRating: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadProducts();
    this.loadArticles();
    this.calculateStats();
  }

  loadCourses(): void {
    this.isLoading = true;
    
    // Simulate API call with demo data
    setTimeout(() => {
      this.courses = [
        {
          id: '1',
          title: 'Credit Repair Fundamentals',
          description: 'Learn the basics of credit repair, understanding credit reports, and disputing negative items.',
          instructor: 'Rick Jefferson',
          duration: '4 hours',
          level: 'beginner',
          category: 'Credit Basics',
          price: 99.99,
          originalPrice: 149.99,
          rating: 4.8,
          studentsEnrolled: 1250,
          thumbnail: '/assets/images/course-credit-basics.jpg',
          lessons: 12,
          isPopular: true,
          tags: ['credit repair', 'basics', 'disputes']
        },
        {
          id: '2',
          title: 'Advanced Dispute Strategies',
          description: 'Master advanced techniques for disputing complex credit issues and negotiating with creditors.',
          instructor: 'Sarah Martinez',
          duration: '6 hours',
          level: 'advanced',
          category: 'Dispute Strategies',
          price: 199.99,
          rating: 4.9,
          studentsEnrolled: 850,
          thumbnail: '/assets/images/course-advanced-disputes.jpg',
          lessons: 18,
          tags: ['advanced', 'disputes', 'negotiation']
        },
        {
          id: '3',
          title: 'Building Business Credit',
          description: 'Complete guide to establishing and building strong business credit profiles.',
          instructor: 'Michael Chen',
          duration: '5 hours',
          level: 'intermediate',
          category: 'Business Credit',
          price: 149.99,
          rating: 4.7,
          studentsEnrolled: 620,
          thumbnail: '/assets/images/course-business-credit.jpg',
          lessons: 15,
          tags: ['business credit', 'entrepreneurship']
        },
        {
          id: '4',
          title: 'Credit Score Optimization',
          description: 'Learn proven strategies to maximize your credit score and maintain excellent credit.',
          instructor: 'Lisa Thompson',
          duration: '3 hours',
          level: 'beginner',
          category: 'Score Optimization',
          price: 0,
          rating: 4.6,
          studentsEnrolled: 2100,
          thumbnail: '/assets/images/course-score-optimization.jpg',
          lessons: 10,
          isFree: true,
          tags: ['free', 'score optimization', 'tips']
        }
      ];
      
      this.filteredCourses = [...this.courses];
      this.isLoading = false;
    }, 1000);
  }

  loadProducts(): void {
    this.products = [
      {
        id: '1',
        name: 'Complete Credit Repair Toolkit',
        description: 'Comprehensive collection of dispute letter templates, legal forms, and credit repair guides.',
        category: 'templates',
        price: 49.99,
        originalPrice: 79.99,
        rating: 4.8,
        reviews: 340,
        image: '/assets/images/product-toolkit.jpg',
        isDigital: true,
        isBestseller: true,
        downloadable: true,
        features: [
          '50+ Dispute Letter Templates',
          'Legal Forms & Documents',
          'Step-by-Step Guides',
          'Video Tutorials',
          'Lifetime Updates'
        ]
      },
      {
        id: '2',
        name: 'Credit Repair Business Starter Kit',
        description: 'Everything you need to start your own credit repair business, including software and training.',
        category: 'software',
        price: 299.99,
        rating: 4.9,
        reviews: 125,
        image: '/assets/images/product-business-kit.jpg',
        isDigital: true,
        features: [
          'Credit Repair Software License',
          'Business Setup Guide',
          'Marketing Materials',
          'Legal Compliance Training',
          '6 Months Support'
        ]
      },
      {
        id: '3',
        name: 'Personal Credit Consultation',
        description: 'One-on-one consultation with a certified credit repair specialist to review your credit profile.',
        category: 'consultation',
        price: 149.99,
        rating: 5.0,
        reviews: 89,
        image: '/assets/images/product-consultation.jpg',
        isDigital: false,
        features: [
          '60-Minute Phone Consultation',
          'Personalized Action Plan',
          'Credit Report Analysis',
          'Follow-up Email Support',
          'Money-Back Guarantee'
        ]
      },
      {
        id: '4',
        name: 'The Credit Repair Handbook',
        description: 'Comprehensive 300-page guide covering all aspects of credit repair and financial recovery.',
        category: 'books',
        price: 29.99,
        originalPrice: 39.99,
        rating: 4.7,
        reviews: 567,
        image: '/assets/images/product-handbook.jpg',
        isDigital: true,
        downloadable: true,
        features: [
          '300+ Pages of Content',
          'Case Studies & Examples',
          'Printable Worksheets',
          'Bonus Chapters',
          'PDF & EPUB Formats'
        ]
      }
    ];
    
    this.filteredProducts = [...this.products];
  }

  loadArticles(): void {
    this.articles = [
      {
        id: '1',
        title: 'Understanding Your Credit Report: A Complete Guide',
        excerpt: 'Learn how to read and interpret every section of your credit report to identify errors and opportunities for improvement.',
        content: 'Full article content here...',
        author: 'Rick Jefferson',
        publishDate: new Date('2024-12-15'),
        readTime: '8 min read',
        category: 'Credit Education',
        tags: ['credit report', 'education', 'basics'],
        image: '/assets/images/article-credit-report.jpg',
        isPopular: true
      },
      {
        id: '2',
        title: '10 Common Credit Repair Mistakes to Avoid',
        excerpt: 'Discover the most common mistakes people make when trying to repair their credit and how to avoid them.',
        content: 'Full article content here...',
        author: 'Sarah Martinez',
        publishDate: new Date('2024-12-10'),
        readTime: '6 min read',
        category: 'Tips & Strategies',
        tags: ['mistakes', 'tips', 'strategy'],
        image: '/assets/images/article-mistakes.jpg'
      },
      {
        id: '3',
        title: 'How to Build Credit from Scratch',
        excerpt: 'Step-by-step guide for building credit when you have no credit history or are starting over.',
        content: 'Full article content here...',
        author: 'Michael Chen',
        publishDate: new Date('2024-12-08'),
        readTime: '10 min read',
        category: 'Credit Building',
        tags: ['credit building', 'beginners', 'guide'],
        image: '/assets/images/article-build-credit.jpg'
      },
      {
        id: '4',
        title: 'The Impact of Credit Utilization on Your Score',
        excerpt: 'Understanding how credit utilization affects your credit score and strategies to optimize it.',
        content: 'Full article content here...',
        author: 'Lisa Thompson',
        publishDate: new Date('2024-12-05'),
        readTime: '5 min read',
        category: 'Score Optimization',
        tags: ['utilization', 'score', 'optimization'],
        image: '/assets/images/article-utilization.jpg',
        isPopular: true
      }
    ];
    
    this.filteredArticles = [...this.articles];
  }

  calculateStats(): void {
    this.stats = {
      totalCourses: this.courses.length,
      totalProducts: this.products.length,
      totalArticles: this.articles.length,
      totalStudents: this.courses.reduce((sum, course) => sum + course.studentsEnrolled, 0),
      avgRating: Number((this.courses.reduce((sum, course) => sum + course.rating, 0) / this.courses.length).toFixed(1))
    };
  }

  setActiveTab(tab: 'courses' | 'store' | 'articles'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.categoryFilter = 'all';
    this.filterContent();
  }

  filterContent(): void {
    switch (this.activeTab) {
      case 'courses':
        this.filterCourses();
        break;
      case 'store':
        this.filterProducts();
        break;
      case 'articles':
        this.filterArticles();
        break;
    }
  }

  filterCourses(): void {
    this.filteredCourses = this.courses.filter(course => {
      const matchesSearch = !this.searchTerm || 
        course.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.categoryFilter === 'all' || course.category === this.categoryFilter;
      const matchesLevel = this.levelFilter === 'all' || course.level === this.levelFilter;
      const matchesPrice = this.priceFilter === 'all' || 
        (this.priceFilter === 'free' && course.price === 0) ||
        (this.priceFilter === 'paid' && course.price > 0);
      
      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.categoryFilter === 'all' || product.category === this.categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }

  filterArticles(): void {
    this.filteredArticles = this.articles.filter(article => {
      const matchesSearch = !this.searchTerm || 
        article.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.categoryFilter === 'all' || article.category === this.categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }

  addToCart(item: Course | Product): void {
    const cartItem = {
      id: item.id,
      name: 'title' in item ? item.title : item.name,
      price: item.price,
      type: 'title' in item ? 'course' : 'product'
    };
    
    if (!this.cartItems.find(ci => ci.id === cartItem.id)) {
      this.cartItems.push(cartItem);
      this.calculateCartTotal();
    }
  }

  removeFromCart(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.calculateCartTotal();
  }

  calculateCartTotal(): void {
    this.cartTotal = this.cartItems.reduce((sum, item) => sum + item.price, 0);
  }

  isInCart(itemId: string): boolean {
    return this.cartItems.some(item => item.id === itemId);
  }

  enrollInCourse(course: Course): void {
    if (course.isFree) {
      console.log('Enrolling in free course:', course.title);
      // Navigate to course content
    } else {
      this.addToCart(course);
    }
  }

  purchaseProduct(product: Product): void {
    this.addToCart(product);
  }

  readArticle(article: Article): void {
    this.router.navigate(['/education/article', article.id]);
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'beginner': return 'badge bg-success';
      case 'intermediate': return 'badge bg-warning';
      case 'advanced': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getCategoryClass(category: string): string {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];
    const index = category.length % colors.length;
    return `badge bg-${colors[index]}`;
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('fas fa-star');
      } else if (i - 0.5 <= rating) {
        stars.push('fas fa-star-half-alt');
      } else {
        stars.push('far fa-star');
      }
    }
    return stars;
  }

  checkout(): void {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/checkout'], { state: { cartItems: this.cartItems } });
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartTotal = 0;
  }
}