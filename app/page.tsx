'use client';

import { useEffect } from 'react';

export default function Home() {
  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu?.classList.toggle('open');
  }

  useEffect(() => {
    // Scroll animation via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.fade-up').forEach(el => {
      observer.observe(el);
    });

    // Sticky navbar shadow on scroll
    const navbar = document.querySelector<HTMLElement>('.navbar');
    const handleScroll = () => {
      if (navbar) {
        navbar.style.boxShadow = window.scrollY > 10
          ? '0 2px 20px rgba(45, 50, 114, 0.08)'
          : 'none';
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#" className="navbar-logo">Pulse<span></span></a>
          <ul className="navbar-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/login">Sign In</a></li>
          </ul>
          <a href="/signup" className="btn btn-primary" style={{display:'flex'}}>Start Free Trial</a>
          <button className="hamburger" aria-label="Menu" onClick={toggleMenu}>
            <span></span><span></span><span></span>
          </button>
        </div>
        <div className="mobile-menu" id="mobileMenu">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="/login">Sign In</a>
          <a href="/signup" className="btn btn-primary">Start Free Trial</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-content">
            <p className="hero-accent fade-up">Finally — a tool built for the floor.</p>
            <h1 className="fade-up delay-1">Your 6S program deserves<br />better than <em>a clipboard<br />and a prayer.</em></h1>
            <p className="hero-sub fade-up delay-2">
              Pulse helps CI and OE teams run structured workplace audits, track scores over time, and close corrective actions — without the paper, the spreadsheets, or the chasing.
            </p>
            <div className="hero-ctas fade-up delay-3">
              <a href="/signup" className="btn btn-primary btn-lg">Start Free Trial</a>
              <a href="#features" className="btn btn-outline btn-lg">See How It Works</a>
            </div>
          </div>

          <div className="hero-visual fade-up delay-2">
            <div className="float-card top-left">
              <div className="float-icon green">✓</div>
              Audit complete
            </div>
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">Q1 Site Audit Dashboard</div>
                <div className="score-badge">Week 11</div>
              </div>
              <div className="score-grid">
                <div className="score-item">
                  <div className="score-item-label">Avg. Score</div>
                  <div className="score-item-value green">87%</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Open Actions</div>
                  <div className="score-item-value yellow">12</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Areas Audited</div>
                  <div className="score-item-value">24</div>
                </div>
                <div className="score-item">
                  <div className="score-item-label">Closed This Week</div>
                  <div className="score-item-value green">8</div>
                </div>
              </div>
              <div className="pulse-chart">
                <span className="chart-label">12-week trend</span>
                <div className="pulse-bars">
                  <div className="pulse-bar" style={{height:'45%'}}></div>
                  <div className="pulse-bar" style={{height:'55%'}}></div>
                  <div className="pulse-bar" style={{height:'48%'}}></div>
                  <div className="pulse-bar highlight" style={{height:'62%'}}></div>
                  <div className="pulse-bar" style={{height:'58%'}}></div>
                  <div className="pulse-bar" style={{height:'70%'}}></div>
                  <div className="pulse-bar highlight" style={{height:'65%'}}></div>
                  <div className="pulse-bar" style={{height:'74%'}}></div>
                  <div className="pulse-bar" style={{height:'72%'}}></div>
                  <div className="pulse-bar top" style={{height:'80%'}}></div>
                  <div className="pulse-bar top" style={{height:'85%'}}></div>
                  <div className="pulse-bar top" style={{height:'88%'}}></div>
                </div>
              </div>
              <div className="action-items">
                <div className="action-item">
                  <div className="action-dot done"></div>
                  <div className="action-text">Label all chemical storage areas</div>
                  <div className="action-owner">J. Rivera</div>
                </div>
                <div className="action-item">
                  <div className="action-dot open"></div>
                  <div className="action-text">Update spill kit inspection log</div>
                  <div className="action-owner">T. Nguyen</div>
                </div>
                <div className="action-item">
                  <div className="action-dot review"></div>
                  <div className="action-text">Restock PPE station — Line 3</div>
                  <div className="action-owner">M. Santos</div>
                </div>
              </div>
            </div>
            <div className="float-card bottom-right">
              <div className="float-icon yellow">✦</div>
              AI summary ready
            </div>

            {/* Hand-drawn clipboard sketch */}
            <svg className="sketch-illustration" width="118" height="160" viewBox="0 0 118 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Clipboard body — slightly wobbly outline */}
              <path d="M 15,31 C 38,29 78,27 103,29 C 103.5,60 104,108 103,151 C 78,153 42,154 14,152 C 14,115 14.5,65 15,31 Z"
                    fill="#FAFAF5" stroke="#2D3272" strokeWidth="2.4" strokeLinejoin="round"/>
              {/* Clip at top */}
              <path d="M 39,21 C 44,20 73,20 79,21 C 79.5,25 79.5,34 79,34 C 74,35 44,35 39,34 C 38.5,29 39,21 39,21 Z"
                    fill="#F0F0E8" stroke="#2D3272" strokeWidth="1.7" strokeLinejoin="round"/>
              {/* Clip ring hole */}
              <ellipse cx="59" cy="26" rx="5.5" ry="5" fill="#FAFAF5" stroke="#2D3272" strokeWidth="1.5"/>

              {/* Row 1 — checked */}
              <path d="M 24,52 C 26,51 37,51 39,52 C 39.5,54 39.5,65 39,65 C 37,66 26,66 24,65 C 23.5,60 24,52 24,52 Z"
                    fill="none" stroke="#2D3272" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M 27,59 L 31,64 L 38,54"
                    fill="none" stroke="#2D3272" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 47,58 C 63,57 82,57 99,58"
                    fill="none" stroke="#2D3272" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>

              {/* Row 2 — checked */}
              <path d="M 24,75 C 26,74 37,74 39,75 C 39.5,77 39.5,88 39,88 C 37,89 26,89 24,88 C 23.5,83 24,75 24,75 Z"
                    fill="none" stroke="#2D3272" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M 27,82 L 31,87 L 38,77"
                    fill="none" stroke="#2D3272" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 47,81 C 65,80 85,80 99,81"
                    fill="none" stroke="#2D3272" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>

              {/* Row 3 — open */}
              <path d="M 24,98 C 26,97 37,97 39,98 C 39.5,100 39.5,111 39,111 C 37,112 26,112 24,111 C 23.5,106 24,98 24,98 Z"
                    fill="none" stroke="#2D3272" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M 47,104 C 65,103 87,103 98,104"
                    fill="none" stroke="#2D3272" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
              <path d="M 47,114 C 61,113 76,113 88,114"
                    fill="none" stroke="#2D3272" strokeWidth="0.9" strokeLinecap="round" opacity="0.32"/>

              {/* Subtle divider */}
              <path d="M 22,126 C 50,125 80,125 100,126"
                    fill="none" stroke="#2D3272" strokeWidth="0.7" strokeLinecap="round" opacity="0.22"/>

              {/* Pulse / heartbeat line in sky blue */}
              <path d="M 22,140 C 30,140 34,140 38,132 C 40.5,127 43,145 47,140 C 55,140 59,140 63,140 C 67,140 71,140 75,133 C 77.5,128 80,145 84,140 C 91,140 97,140 101,140"
                    fill="none" stroke="#2D8FBF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.82"/>
            </svg>

          </div>
        </div>

        <div className="hero-trust">
          <hr className="hero-trust-rule" />
          <p className="hero-trust-text">Used in labs, warehouses, and production floors — wherever 6S lives.</p>
          <div className="trust-pills">
            <div className="trust-pill">No paper. No re-entry.</div>
            <div className="trust-pill">Action items auto-assigned</div>
            <div className="trust-pill">Dashboards that build themselves</div>
            <div className="trust-pill">Works on any device</div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM / SOLUTION ─── */}
      <section className="problem-solution" id="features">
        <div className="container">
          <div className="section-label fade-up">The honest truth</div>
          <h2 className="section-headline fade-up delay-1">Sound familiar?</h2>
          <p className="section-sub fade-up delay-2">Most audit programs aren&apos;t failing because of people. They&apos;re failing because of the tools — or the lack of them.</p>

          <div className="ps-grid">
            <div className="ps-column fade-up delay-1">
              <div className="ps-column-label problem">The problem</div>
              <div className="ps-item">
                <div className="ps-icon problem-icon">✕</div>
                <div className="ps-text">
                  <strong>Paper checklists go missing.</strong>
                  Scores never get recorded. That audit happened. You just can&apos;t prove it.
                </div>
              </div>
              <div className="ps-item">
                <div className="ps-icon problem-icon">✕</div>
                <div className="ps-text">
                  <strong>Spreadsheets break.</strong>
                  Action items fall through the cracks. Nobody knows who owns what — or if it&apos;s even still a problem.
                </div>
              </div>
              <div className="ps-item">
                <div className="ps-icon problem-icon">✕</div>
                <div className="ps-text">
                  <strong>You spend hours building reports</strong>
                  instead of driving improvement. Your ops meeting prep takes longer than the ops meeting.
                </div>
              </div>
            </div>

            <div className="ps-column fade-up delay-2">
              <div className="ps-column-label solution">With Pulse</div>
              <div className="ps-item">
                <div className="ps-icon solution-icon">✓</div>
                <div className="ps-text">
                  <strong>Pulse guides your team through every audit on any device.</strong>
                  No paper, no re-entry. The record is created the moment it&apos;s completed.
                </div>
              </div>
              <div className="ps-item">
                <div className="ps-icon solution-icon">✓</div>
                <div className="ps-text">
                  <strong>Findings auto-generate action items</strong>
                  with owners, due dates, and status tracking. Nothing falls through the cracks because there are no cracks.
                </div>
              </div>
              <div className="ps-item">
                <div className="ps-icon solution-icon">✓</div>
                <div className="ps-text">
                  <strong>Trend charts and dashboards build themselves.</strong>
                  You show up to the meeting ready — with data, stories, and a plan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features">
        <div className="container">
          <div className="section-label fade-up">What&apos;s inside</div>
          <h2 className="section-headline fade-up delay-1">Everything you need.<br />Nothing you don&apos;t.</h2>
          <p className="section-sub fade-up delay-2">Built for the way operational excellence teams actually work — on the floor, in the meeting room, and everywhere in between.</p>

          <div className="features-grid">
            <div className="feature-card fade-up delay-1">
              <div className="feature-icon navy">🏭</div>
              <h3>Multi-Area Audit Management</h3>
              <p>Run audits across every area of your site from one place. Assign, schedule, and track — all without a single spreadsheet.</p>
            </div>
            <div className="feature-card fade-up delay-2">
              <div className="feature-icon sky">📋</div>
              <h3>Customizable Checklists</h3>
              <p>Build a standard template, then tailor it for labs, warehouses, or production floors. Your standard, your way.</p>
            </div>
            <div className="feature-card fade-up delay-3">
              <div className="feature-icon teal">📈</div>
              <h3>Score Tracking &amp; Trends</h3>
              <p>Every audit is automatically scored and plotted. See where you&apos;re improving and where you&apos;re not — at a glance.</p>
            </div>
            <div className="feature-card fade-up delay-1">
              <div className="feature-icon yellow">⚡</div>
              <h3>Action Item Workflow</h3>
              <p>Findings become tasks. Tasks get assigned. Work gets done. No follow-up email required.</p>
            </div>
            <div className="feature-card fade-up delay-2">
              <div className="feature-icon navy">✦</div>
              <h3>AI-Powered Summaries</h3>
              <p>After every audit, Pulse writes a plain-language summary you can paste straight into your ops update. Done.</p>
            </div>
            <div className="feature-card fade-up delay-3">
              <div className="feature-icon sky">🔐</div>
              <h3>Role-Based Access</h3>
              <p>You run the program. Area owners do their part. Leadership sees what they need. Everyone&apos;s in the right lane.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="social-proof">
        <div className="container">
          <div className="section-label fade-up" style={{color:'#5BB8D4'}}>From the people using it</div>
          <h2 className="section-headline fade-up delay-1">Built for the floor.<br />Loved by the people who own it.</h2>
          <p className="section-sub fade-up delay-2">These aren&apos;t edge cases. This is what happens when OE teams finally have the right tool.</p>
        </div>

        <div className="testimonials-grid container">
          <div className="testimonial-card fade-up delay-1">
            <div className="stars">★★★★★</div>
            <p className="testimonial-quote">I used to spend two hours every month just consolidating audit scores into a report. With Pulse, my dashboard is always ready. I don&apos;t even think about it anymore.</p>
            <div className="testimonial-author">
              <div className="testimonial-name">Maria T.</div>
              <div className="testimonial-role">CI Manager, Medical Device Manufacturing</div>
            </div>
          </div>
          <div className="testimonial-card fade-up delay-2">
            <div className="stars">★★★★★</div>
            <p className="testimonial-quote">Our area owners actually use it. That&apos;s the part I didn&apos;t expect. The audit takes less than 5 minutes on their phone. Before Pulse, getting anyone to fill out a paper form was a whole project.</p>
            <div className="testimonial-author">
              <div className="testimonial-name">James R.</div>
              <div className="testimonial-role">OE Lead, Biotech</div>
            </div>
          </div>
          <div className="testimonial-card fade-up delay-3">
            <div className="stars">★★★★★</div>
            <p className="testimonial-quote">The AI summary after each audit is my favorite feature. It writes the ops update for me. My VP always comments on how clear and consistent our reporting has gotten. I just smile.</p>
            <div className="testimonial-author">
              <div className="testimonial-name">Deb K.</div>
              <div className="testimonial-role">Senior OE Manager, Life Sciences</div>
            </div>
          </div>
        </div>

        <div className="proof-cta fade-up">
          <p className="proof-cta-headline">Ready to take the pulse of your operation?</p>
          <a href="/signup" className="btn btn-yellow">Start Free Trial</a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">Pulse<span></span></div>
            <div className="footer-tagline">Take the vital signs of your operation.</div>
          </div>
          <div className="footer-right">
            &copy; 2026 Pulse. Built for the floor.
          </div>
        </div>
      </footer>
    </>
  );
}
