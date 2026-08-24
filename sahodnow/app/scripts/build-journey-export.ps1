# Build journey-export.html — user journey screens for Modao / PRD import
# Run: powershell -ExecutionPolicy Bypass -File scripts/build-journey-export.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$Css = [IO.File]::ReadAllText((Join-Path $Root 'css\app.css'), [Text.Encoding]::UTF8)

# ASCII-only constants (avoid PowerShell script encoding issues)
$P = '&#8369;'
$Bull = '&#8226;'
$Dot = '&#183;'
$Arr = '&rarr;'
$Payout = "GCash $Dot$Dot$Dot$Dot 4521"

$Phases = @(
  @{ id=1; labelEn='Install ~ Register' }
  @{ id=2; labelEn='KYC ~ Credit Review' }
  @{ id=3; labelEn='Borrow ~ Disbursement' }
  @{ id=4; labelEn='Repayment' }
  @{ id=5; labelEn='Premier Credit' }
)

$Journey = @(
  @{ n=1;  phase=1; stage='Install / Launch';       file='index.html';              xf=$null }
  @{ n=2;  phase=1; stage='Home';                  file='home-guest.html';         xf=$null }
  @{ n=3;  phase=1; stage='Register';              file='login.html';              xf=$null }
  @{ n=4;  phase=1; stage='Register';              file='otp.html';                xf=$null }
  @{ n=5;  phase=1; stage='Register';              file='password.html';           xf=$null }
  @{ n=6;  phase=2; stage='Home (KYC)';            file='home.html';               xf='kyc' }
  @{ n=7;  phase=2; stage='KYC';                   file='kyc-basic.html';          xf=$null }
  @{ n=8;  phase=2; stage='KYC (ID)';                file='kyc-id.html';             xf=$null }
  @{ n=9;  phase=2; stage='KYC (ID filled)';         file='kyc-id.html';             xf='id-filled' }
  @{ n=10; phase=2; stage='KYC (Liveness)';          file='kyc-liveness.html';       xf='liveness-done' }
  @{ n=11; phase=2; stage='KYC';                   file='kyc-contact.html';        xf=$null }
  @{ n=12; phase=2; stage='KYC';                   file='kyc-enhance.html';        xf=$null }
  @{ n=13; phase=2; stage='Credit Review';         file='review.html';             xf='pending' }
  @{ n=14; phase=2; stage='Link Payout';           file='payout-bind.html';        xf=$null }
  @{ n=15; phase=2; stage='Credit Review';         file='review.html';             xf='approved' }
  @{ n=16; phase=3; stage='Home (Approved)';      file='home.html';               xf='approved' }
  @{ n=17; phase=3; stage='Borrow';                file='order.html';              xf=$null }
  @{ n=18; phase=3; stage='Repayment Plan';        file='order.html';              xf='plan-overlay' }
  @{ n=19; phase=3; stage='Loan Agreement';        file='order.html';              xf='agreement-overlay' }
  @{ n=20; phase=3; stage='Listing Review';        file='listing-review.html';     xf=$null }
  @{ n=21; phase=3; stage='Disbursement';          file='disbursement-review.html';xf=$null }
  @{ n=22; phase=3; stage='Disbursement';          file='disbursement.html';       xf=$null }
  @{ n=23; phase=4; stage='Repayment';             file='bill.html';               xf=$null }
  @{ n=24; phase=4; stage='Repayment';             file='bill-current.html';       xf=$null }
  @{ n=25; phase=4; stage='Repayment';             file='bill-all.html';           xf=$null }
  @{ n=26; phase=4; stage='Repayment';             file='bill-history.html';       xf=$null }
  @{ n=27; phase=4; stage='Repayment';             file='loan-detail.html';        xf=$null }
  @{ n=28; phase=5; stage='Home (Premier)';        file='home-premium.html';       xf=$null }
  @{ n=29; phase=5; stage='Borrow (Premier)';      file='order-premium.html';      xf=$null }
)

# Modao-only: all home page states in one row (labels from scripts/journey-home-states-zh.txt)
$HomeStates = @(
  @{ id=91; slug='guest';               labelEn='Guest';               file='home-guest.html';   xf=$null }
  @{ id=92; slug='kyc';                 labelEn='KYC locked';            file='home.html';         xf='kyc' }
  @{ id=93; slug='reviewing';           labelEn='Credit review';         file='home.html';         xf='reviewing' }
  @{ id=94; slug='credit-rejected';      labelEn='Credit rejected';         file='home.html';         xf='credit-rejected' }
  @{ id=95; slug='credit-expired';       labelEn='Limit expired';         file='home.html';         xf='credit-expired' }
  @{ id=96; slug='approved';            labelEn='Has limit';             file='home.html';         xf='approved' }
  @{ id=97; slug='listing-review';      labelEn='Listing review';        file='home.html';         xf='listing-review' }
  @{ id=98; slug='disbursement-review'; labelEn='Disbursement review';   file='home.html';         xf='disbursement-review' }
  @{ id=99; slug='listing-rejected';    labelEn='Listing declined';      file='home.html';         xf='listing-rejected' }
  @{ id=100; slug='disbursement-failed'; labelEn='Disbursement failed';   file='home.html';         xf='disbursement-failed' }
  @{ id=101; slug='premier';             labelEn='Premier';               file='home-premium.html'; xf=$null }
)

function Get-BottomNav([string]$Active) {
  @"
<nav class="bottom-nav">
  <a href="#" class="nav-item$(if ($Active -eq 'home') { ' active' })"><svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>Home</a>
  <a href="#" class="nav-item$(if ($Active -eq 'bill') { ' active' })"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.5"/></svg>Bills</a>
  <a href="#" class="nav-item$(if ($Active -eq 'profile') { ' active' })"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>Profile</a>
</nav>
"@
}

function Get-KycStep([int]$N) { "<p class=`"eyebrow`"><span class=`"dot`">$Bull</span> Step $N of 4</p>" }
function Get-KycProgress([int]$ActiveIdx) {
  $parts = 0..3 | ForEach-Object {
    $cls = ''; if ($_ -lt $ActiveIdx) { $cls += ' done' }; if ($_ -eq $ActiveIdx) { $cls += ' active' }
    "<div class=`"progress-step$cls`"></div>"
  }
  "<div class=`"progress-bar`">$($parts -join '')</div>"
}
function Get-KycStepFor([string]$Step) {
  $n = @{ basic = 1; id = 2; liveness = 3; contact = 4 }[$Step]
  if (-not $n) { throw "Unknown KYC step: $Step" }
  Get-KycStep $n
}
function Get-KycProgressFor([string]$Step) {
  $idx = @{ basic = 0; id = 1; liveness = 2; contact = 3 }[$Step]
  if ($null -eq $idx) { throw "Unknown KYC step: $Step" }
  Get-KycProgress $idx
}
function Get-KycProgressCompleted([int]$ThroughIdx) {
  $parts = 0..3 | ForEach-Object {
    $cls = if ($_ -le $ThroughIdx) { ' done' } else { '' }
    "<div class=`"progress-step$cls`"></div>"
  }
  "<div class=`"progress-bar`">$($parts -join '')</div>"
}
function Get-KycHomeProgress() {
  '<div class="home-kyc-step active"></div><div class="home-kyc-step"></div><div class="home-kyc-step"></div><div class="home-kyc-step"></div>'
}
function Get-FlowProgress([string]$Active) {
  $steps = @(
    @{ title='Listing review'; descActive='Reviewing your application...'; descDone='Approved'; descPending='Pending' },
    @{ title='Disbursement review'; descActive='Transferring to your account...'; descDone='Completed'; descPending='Up next' }
  )
  $order = @('listing','disbursement'); $activeIdx = [array]::IndexOf($order, $Active); $html = ''
  for ($i = 0; $i -lt $steps.Count; $i++) {
    $state = if ($i -lt $activeIdx) { 'done' } elseif ($i -eq $activeIdx) { 'active' } else { 'pending' }
    $step = $steps[$i]
    $desc = if ($state -eq 'active') { $step.descActive } elseif ($state -eq 'done') { $step.descDone } else { $step.descPending }
    $node = if ($state -eq 'done') { '<span class="loan-flow-check">&#10003;</span>' } elseif ($state -eq 'active') { '<span class="loan-flow-spinner"></span>' } else { '<span class="loan-flow-dot"></span>' }
    $line = if ($i -eq $steps.Count - 1) { '' } else { "<span class=`"loan-flow-line loan-flow-line--$state`"></span>" }
    $html += "<div class=`"loan-flow-step loan-flow-step--$state`"><div class=`"loan-flow-track`">$node$line</div><div class=`"loan-flow-body`"><p class=`"loan-flow-title`">$($step.title)</p><p class=`"loan-flow-desc`">$desc</p></div></div>"
  }
  "<div class=`"loan-flow-progress`">$html</div>"
}

$RepayTimeline = @"
<div class="repay-timeline">
  <div class="repay-timeline-item repay-timeline-item--current">
    <div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 1</span><span class="repay-timeline-date">06/20/2026</span></div>
    <div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div>
    <div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}1,767</span></p><p class="repay-timeline-breakdown">Principal ${P}1,606 + Int. &amp; fees ${P}161</p></div>
  </div>
  <div class="repay-timeline-item"><div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 2</span><span class="repay-timeline-date">07/20/2026</span></div><div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div><div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}1,767</span></p><p class="repay-timeline-breakdown">Principal ${P}1,606 + Int. &amp; fees ${P}161</p></div></div>
  <div class="repay-timeline-item"><div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 3</span><span class="repay-timeline-date">08/20/2026</span></div><div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div><div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}1,767</span></p><p class="repay-timeline-breakdown">Principal ${P}1,606 + Int. &amp; fees ${P}161</p></div></div>
</div>
"@

$OrderPlanTimeline = @"
<div class="repay-timeline" role="list">
  <div class="repay-timeline-item repay-timeline-item--current" role="listitem">
    <div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 1</span><span class="repay-timeline-date">07/24/2026</span></div>
    <div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div>
    <div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}2,472</span></p><p class="repay-timeline-breakdown">Principal ${P}1,666 + Int. &amp; fees ${P}806</p></div>
  </div>
  <div class="repay-timeline-item" role="listitem">
    <div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 2</span><span class="repay-timeline-date">08/24/2026</span></div>
    <div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div>
    <div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}1,816</span></p><p class="repay-timeline-breakdown">Principal ${P}1,666 + Int. &amp; fees ${P}150</p></div>
  </div>
  <div class="repay-timeline-item" role="listitem">
    <div class="repay-timeline-left"><span class="repay-timeline-inst">Inst. 3</span><span class="repay-timeline-date">09/24/2026</span></div>
    <div class="repay-timeline-rail" aria-hidden="true"><span class="repay-timeline-dot"></span></div>
    <div class="repay-timeline-right"><p class="repay-timeline-amount-line"><span class="repay-timeline-tag">Amount due</span><span class="repay-timeline-amount">${P}1,816</span></p><p class="repay-timeline-breakdown">Principal ${P}1,668 + Int. &amp; fees ${P}148</p></div>
  </div>
</div>
"@

$PayoutPickerList = @"
<button type="button" class="payout-account-option selected">
  <span class="payout-account-option__main"><span class="payout-account-option__title">GCash $Dot$Dot$Dot$Dot 4521</span><span class="payout-account-option__sub">E-wallet</span></span>
  <span class="payout-account-option__check">&#10003;</span>
</button>
<button type="button" class="payout-account-option">
  <span class="payout-account-option__main"><span class="payout-account-option__title">BPI $Dot$Dot$Dot$Dot 7890</span><span class="payout-account-option__sub">Bank account</span></span>
</button>
"@

$BillMain = @"
<div class="bill-hero"><p class="bill-hero-label">Due 06/20/2026</p><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;"><p class="bill-hero-amount" style="margin:0;">${P}1,767</p><a href="#" style="flex-shrink:0;display:inline-flex;align-items:center;gap:6px;margin-bottom:6px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.12);color:rgba(243,240,238,0.92);text-decoration:none;font-weight:500;font-size:13px;">Details <span aria-hidden="true">$Arr</span></a></div><p class="bill-hero-meta">Loans after the 10th are billed next cycle.</p><div class="bill-hero-actions"><button class="btn btn-consent" type="button">Repay</button></div></div>
<a class="bill-link-card" href="#"><div class="bill-link-leading"><span class="bill-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 7h10M7 11h10M7 15h7" stroke="#141413" stroke-width="1.6" stroke-linecap="round"/></svg></span><div class="bill-link-text"><h3>Installment loans</h3><p>Total loan orders</p></div></div><span class="bill-link-arrow">$Arr</span></a>
<a class="bill-link-card" href="#"><div class="bill-link-leading"><span class="bill-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 7v5l3 2" stroke="#141413" stroke-width="1.6" stroke-linecap="round"/></svg></span><div class="bill-link-text"><h3>Statement history</h3><p>Monthly statements</p></div></div><span class="bill-link-arrow">$Arr</span></a>
<a class="bill-link-card" href="#"><div class="bill-link-leading"><span class="bill-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="#141413" stroke-width="1.2"/></svg></span><div class="bill-link-text"><h3>How to repay</h3><p>Due dates &amp; payment steps</p></div></div><span class="bill-link-arrow">$Arr</span></a>
"@

$BillCurrentMain = @"
<div class="bill-hero" style="margin-bottom:20px;"><p class="bill-hero-label">Total outstanding</p><p class="bill-hero-amount">${P}5,301</p><p class="bill-hero-meta">1 loan</p><button class="btn btn-consent" type="button">Repay</button></div>
<p class="eyebrow" style="margin-bottom:12px;"><span class="dot">$Bull</span> All orders</p>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">Installment loan</p><p class="text-muted" style="margin:0;">1/3</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">${P}5,301</p><span class="status">Details $Arr</span></div></div>
"@

$BillAllMain = @"
<div class="bill-hero" style="margin-bottom:20px;"><p class="bill-hero-label">Total outstanding</p><p class="bill-hero-amount">${P}5,301</p></div>
<div class="tab-bar" role="tablist" aria-label="Loan orders">
  <button type="button" class="tab-item active" role="tab" aria-selected="true">In progress</button>
  <button type="button" class="tab-item" role="tab" aria-selected="false">Completed</button>
</div>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">${P}5,000</p><p class="text-muted" style="margin:0;">06/17/2026</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">3</p><span class="status">Installments left</span></div></div>
"@

$BillHistoryMain = @"
<div class="month-split-card" style="margin-bottom:12px;">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <p class="eyebrow" style="margin:0;"><span class="dot">$Bull</span> 06/2026</p>
    <p class="text-muted" style="margin:0;font-size:12px;">Total ${P}1,700</p>
  </div>
</div>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">Installment loan</p><p class="text-muted" style="margin:0;">1/5</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">${P}900</p><span class="status paid">Paid</span></div></div>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">Installment loan</p><p class="text-muted" style="margin:0;">1/5</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">${P}800</p><span class="status paid">Paid</span></div></div>
<div class="month-split-card" style="margin-bottom:12px;margin-top:20px;">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <p class="eyebrow" style="margin:0;"><span class="dot">$Bull</span> 05/2026</p>
    <p class="text-muted" style="margin:0;font-size:12px;">Total ${P}1,700</p>
  </div>
</div>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">Installment loan</p><p class="text-muted" style="margin:0;">2/5</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">${P}900</p><span class="status paid">Paid</span></div></div>
<div class="bill-item"><div><p style="font-weight:500;margin:0 0 4px;">Installment loan</p><p class="text-muted" style="margin:0;">2/5</p></div><div style="text-align:right;"><p class="amount" style="margin:0;">${P}800</p><span class="status paid">Paid</span></div></div>
"@

$HeaderHome = '<button class="header-icon-btn" type="button" aria-label="Support"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2a8 8 0 00-8 8v3a3 3 0 003 3h1.5v-3H7a5 5 0 0110 0v3h1.5a3 3 0 003-3v-3a8 8 0 00-8-8z" stroke="currentColor" stroke-width="1.5"/></svg></button><button class="header-icon-btn" type="button" aria-label="Messages"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16a2 2 0 012 2v9a2 2 0 01-2 2H8l-4 3v-3H4a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" stroke-width="1.5"/></svg><span class="header-icon-badge"></span></button>'
$HeaderGuest = '<button class="btn btn-secondary btn-header-login" type="button">Log in</button>'

$KycPrivacyNote = '<span class="kyc-privacy-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M10 2l7 3.5v5c0 4.2-2.8 8.1-7 9.5C5.8 18.6 3 14.7 3 10.5v-5L10 2z" stroke="currentColor" stroke-width="1.3"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><p>Your information is encrypted and used only for verification. We never sell your data.</p>'

$IdTopList = '<button type="button" class="id-type-card selected"><span class="id-type-name">National ID (PhilSys)</span><span class="id-type-badge">Recommended</span></button><button type="button" class="id-type-card"><span class="id-type-name">Philippine Passport</span></button><button type="button" class="id-type-card"><span class="id-type-name">Driver''s License</span></button><button type="button" class="id-type-card"><span class="id-type-name">UMID</span></button>'

$SpanIds = @('review-applied','review-amount','review-payout','disb-amount','disb-payout','rej-applied','rej-amount','rej-payout','fail-applied','fail-amount','fail-payout','otp-phone-display','approved-limit','amount-display','max-amount','due-date-hint','sum-first-amount','payout-display','loan-id','loan-applied','loan-principal','loan-term','loan-payout','loan-remaining','loan-status','limit-available','limit-used','limit-total','limit-uplift')

$Injections = @{
  'home-guest.html' = @{ 'bottom-nav' = (Get-BottomNav 'home'); 'header-actions' = $HeaderGuest }
  'home.html' = @{ 'bottom-nav' = (Get-BottomNav 'home'); 'header-actions' = $HeaderHome; 'kyc-progress' = (Get-KycHomeProgress) }
  'otp.html' = @{ 'otp-phone-display' = '+63 917 123 4567' }
  'kyc-basic.html' = @{ 'step-label' = (Get-KycStepFor 'basic'); 'progress-bar' = (Get-KycProgressFor 'basic'); 'kyc-privacy-note' = $KycPrivacyNote }
  'kyc-id.html' = @{ 'step-label' = (Get-KycStepFor 'id'); 'progress-bar' = (Get-KycProgressFor 'id'); 'id-top-list' = $IdTopList; 'kyc-privacy-note' = $KycPrivacyNote }
  'kyc-liveness.html' = @{ 'step-label' = (Get-KycStepFor 'liveness'); 'progress-bar' = (Get-KycProgressFor 'liveness'); 'kyc-privacy-note' = $KycPrivacyNote }
  'kyc-contact.html' = @{ 'step-label' = (Get-KycStepFor 'contact'); 'progress-bar' = (Get-KycProgressFor 'contact'); 'kyc-privacy-note' = $KycPrivacyNote }
  'kyc-enhance.html' = @{ 'kyc-privacy-note' = $KycPrivacyNote }
  'review.html' = @{ 'approved-limit' = "${P}10,000" }
  'listing-review.html' = @{ 'flow-progress' = (Get-FlowProgress 'listing'); 'review-applied' = '06/17/2026, 2:30 PM'; 'review-amount' = "${P}5,000"; 'review-payout' = $Payout }
  'disbursement-review.html' = @{ 'flow-progress' = (Get-FlowProgress 'disbursement'); 'review-applied' = '06/17/2026, 2:30 PM'; 'review-amount' = "${P}5,000"; 'review-payout' = $Payout }
  'disbursement.html' = @{ 'disb-amount' = "${P}5,000"; 'disb-payout' = $Payout }
  'listing-rejected.html' = @{ 'rej-applied' = '06/17/2026, 2:30 PM'; 'rej-amount' = "${P}5,000"; 'rej-payout' = $Payout }
  'disbursement-failed.html' = @{ 'fail-applied' = '06/17/2026, 2:30 PM'; 'fail-amount' = "${P}5,000"; 'fail-payout' = $Payout }
  'order.html' = @{ 'amount-display' = "${P}5,000"; 'max-amount' = "${P}10,000"; 'due-date-hint' = '24th each month'; 'sum-first-amount' = "${P}2,472"; 'payout-display' = $Payout }
  'order-premium.html' = @{ 'amount-display' = "${P}15,000"; 'max-amount' = "${P}50,000"; 'due-date-hint' = '24th each month'; 'sum-first-amount' = "${P}5,950"; 'payout-display' = $Payout }
  'home-premium.html' = @{ 'bottom-nav' = (Get-BottomNav 'home'); 'header-actions' = $HeaderHome; 'limit-available' = "${P}38,000"; 'limit-used' = "${P}12,000"; 'limit-total' = "${P}50,000"; 'limit-uplift' = "+ ${P}40,000" }
  'bill.html' = @{ 'bill-main' = $BillMain; 'bottom-nav' = (Get-BottomNav 'bill'); 'header-actions' = $HeaderHome }
  'bill-current.html' = @{ 'bill-current-main' = $BillCurrentMain }
  'bill-all.html' = @{ 'bill-all-main' = $BillAllMain }
  'bill-history.html' = @{ 'history-list' = $BillHistoryMain }
  'loan-detail.html' = @{ 'schedule-list' = $RepayTimeline; 'loan-id' = 'CL20260617001'; 'loan-applied' = '06/17/2026'; 'loan-principal' = "${P}5,000"; 'loan-term' = '3 mo.'; 'loan-payout' = $Payout; 'loan-remaining' = "${P}5,301"; 'loan-status' = 'Active' }
}

function Inject-Element { param([string]$Body,[string]$Id,[string]$Content)
  $isSpan = $SpanIds -contains $Id; $tag = if ($isSpan) { 'span' } else { 'div' }
  $emptyPat = "<$tag([^>]*id=`"$Id`"[^>]*)>\s*</$tag>"
  if ($Body -match $emptyPat) {
    return [regex]::Replace($Body, $emptyPat, { param($m) "<$tag$($m.Groups[1].Value)>$Content</$tag>" }, 1)
  }
  return [regex]::Replace($Body, "(<$tag[^>]*id=`"$Id`"[^>]*>)([\s\S]*?)(</$tag>)", { param($m) "$($m.Groups[1].Value)$Content$($m.Groups[3].Value)" }, 1)
}
function Inject-Paragraph { param([string]$Body,[string]$Id,[string]$Content)
  $pat = "<p([^>]*id=`"$Id`"[^>]*)>\s*</p>"
  if ($Body -match $pat) { return [regex]::Replace($Body, $pat, "<p`$1>$Content</p>", 1) }; return $Body
}
function Extract-Body([string]$Html) { if ($Html -match '(?is)<body[^>]*>(.*)</body>') { return $Matches[1].Trim() }; return $Html }

function Get-HomeLoanFlowFooter([string]$State) {
  $amount = "${P}5,000"
  $rows = @{
    'listing-review'      = @{ status='In review'; hint='ETA: 1&ndash;3 minutes for a result' }
    'disbursement-review' = @{ status='Disbursing'; hint='ETA: 1&ndash;5 minutes to receive funds' }
    'listing-rejected'    = @{ status='Declined'; hint='Please try again in 7 days' }
    'disbursement-failed' = @{ status='Failed'; hint='Result is ready &middot; View next steps' }
  }
  $m = $rows[$State]
  if (-not $m) { throw "Unknown home flow state: $State" }
  @"
<div class="home-loan-status-panel">
  <div class="home-loan-status-left">
    <p class="home-loan-status-text"><strong>$amount</strong> &middot; $($m.status)</p>
    <p class="home-loan-status-sub">$($m.hint)</p>
  </div>
  <span class="home-loan-status-cta">View details $Arr</span>
</div>
"@
}

function Apply-HomeApprovedFlowState([string]$Body, [string]$FlowState) {
  $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:block;"'
  $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:none !important;"'
  $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:none !important;"'
  $Body = $Body -replace '(?<=id="limit-available">)[^<]*(?=<)', "${P}5,000"
  $Body = $Body -replace '(?<=id="limit-used">)[^<]*(?=<)', "${P}5,000"
  $Body = $Body -replace '(?<=id="limit-total">)[^<]*(?=<)', "${P}10,000"
  $Body = $Body -replace 'id="limit-card-borrow" class="home-limit-borrow"', 'id="limit-card-borrow" class="home-limit-borrow" style="display:none !important;"'
  $Body = $Body -replace 'id="limit-card-flow" class="home-limit-flow-wrap" style="display:none;"', 'id="limit-card-flow" class="home-limit-flow-wrap" style="display:block;"'
  $Body = Inject-Element $Body 'limit-card-flow' (Get-HomeLoanFlowFooter $FlowState)
  return $Body
}

function Apply-Transform([string]$Body, [string]$File, [string]$Xf) {
  if (-not $Xf) { return $Body }
  switch ("$File|$Xf") {
    'home.html|kyc' {
      $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:block;"'
      $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:none !important;"'
      $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:none !important;"'
      $Body = $Body -replace '<div id="home-state-switcher"></div>', '<div id="home-state-switcher" style="display:none;"></div>'
      $kycProgress = '<div class="home-kyc-step done"></div><div class="home-kyc-step active"></div><div class="home-kyc-step"></div><div class="home-kyc-step"></div>'
      $Body = [regex]::Replace($Body, '(?s)(<div class="home-kyc-progress[^"]*" id="kyc-progress">).*?(</div>\s*<p class="home-kyc-summary")', { param($m) "$($m.Groups[1].Value)$kycProgress$($m.Groups[2].Value)" }, 1)
      $Body = $Body -replace '(?<=id="kyc-current-prompt">)[^<]*(?=<)', 'Submit valid ID to speed up limit review'
    }
    'home.html|approved' {
      $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:block;"'
      $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:none !important;"'
      $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:none !important;"'
      $Body = $Body -replace '(?<=id="limit-available">)[^<]*(?=<)', "${P}10,000"
      $Body = $Body -replace '(?<=id="limit-used">)[^<]*(?=<)', "${P}0"
      $Body = $Body -replace '(?<=id="limit-total">)[^<]*(?=<)', "${P}10,000"
      $Body = $Body -replace 'id="limit-card-flow" class="home-limit-flow-wrap" style="display:none;"', 'id="limit-card-flow" class="home-limit-flow-wrap" style="display:none !important;"'
    }
    'home.html|reviewing' {
      $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:block;"'
      $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:none !important;"'
      $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:none !important;"'
      $Body = $Body -replace '(?<=id="home-review-countdown">)[^<]*(?=<)', '10s'
    }
    'home.html|credit-rejected' {
      $Body = $Body -replace 'id="state-credit-rejected" style="display:none;"', 'id="state-credit-rejected" style="display:block;"'
      $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:none !important;"'
      $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:none !important;"'
      $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:none !important;"'
      $Body = $Body -replace 'id="state-credit-expired" style="display:none;"', 'id="state-credit-expired" style="display:none !important;"'
      $Body = $Body -replace '<div id="home-state-switcher"></div>', '<div id="home-state-switcher" style="display:none;"></div>'
    }
    'home.html|credit-expired' {
      $Body = $Body -replace 'id="state-credit-expired" style="display:none;"', 'id="state-credit-expired" style="display:block;"'
      $Body = $Body -replace 'id="state-kyc" style="display:none;"', 'id="state-kyc" style="display:none !important;"'
      $Body = $Body -replace 'id="state-reviewing" style="display:none;"', 'id="state-reviewing" style="display:none !important;"'
      $Body = $Body -replace 'id="state-credit-rejected" style="display:none;"', 'id="state-credit-rejected" style="display:none !important;"'
      $Body = $Body -replace 'id="state-approved" style="display:none;"', 'id="state-approved" style="display:none !important;"'
      $Body = $Body -replace '(?<=id="expired-hero-value">)[^<]*(?=<)', "Up to ${P}10,000"
      $Body = $Body -replace '<div id="home-state-switcher"></div>', '<div id="home-state-switcher" style="display:none;"></div>'
    }
    'home.html|listing-review' { $Body = Apply-HomeApprovedFlowState $Body 'listing-review' }
    'home.html|disbursement-review' { $Body = Apply-HomeApprovedFlowState $Body 'disbursement-review' }
    'home.html|listing-rejected' {
      $Body = Apply-HomeApprovedFlowState $Body 'listing-rejected'
      $Body = $Body -replace 'id="state-credit-expired" style="display:none;"', 'id="state-credit-expired" style="display:none !important;"'
      $Body = $Body -replace '<div id="home-state-switcher"></div>', '<div id="home-state-switcher" style="display:none;"></div>'
    }
    'home.html|disbursement-failed' {
      $Body = Apply-HomeApprovedFlowState $Body 'disbursement-failed'
      $Body = $Body -replace 'id="state-credit-expired" style="display:none;"', 'id="state-credit-expired" style="display:none !important;"'
      $Body = $Body -replace '<div id="home-state-switcher"></div>', '<div id="home-state-switcher" style="display:none;"></div>'
    }
    'review.html|pending' {
      $Body = $Body -replace 'id="review-done" style="display:none;"', 'id="review-done" style="display:none !important;"'
    }
    'review.html|approved' {
      $Body = $Body -replace 'id="review-pending">', 'id="review-pending" style="display:none !important;">'
      $Body = $Body -replace 'id="review-done" style="display:none;"', 'id="review-done" style="display:block;"'
      $Body = $Body -replace 'id="btn-home" style="display:none;', 'id="btn-home" style="display:block;'
      $Body = $Body -replace 'id="bind-card-section"', 'id="bind-card-section" style="display:none;"'
    }
    'kyc-liveness.html|liveness-done' {
      $Body = $Body -replace 'id="btn-scan">', 'id="btn-scan" style="display:none;">'
      $Body = $Body -replace 'id="btn-next" style="display:none;"', 'id="btn-next" style="display:block;"'
      $Body = $Body -replace 'id="face-check" style="display:none;', 'id="face-check" style="display:inline;'
      $Body = $Body -replace 'class="face-auth-status" id="liveness-status"></p>', 'class="face-auth-status success" id="liveness-status">Liveness verified</p>'
      $doneProgress = Get-KycProgressCompleted 2
      $Body = [regex]::Replace($Body, '(?s)<div id="progress-bar">.*?</div>\s*(?=<div class="face-security-badge")', "<div id=`"progress-bar`">$doneProgress</div>`n      ", 1)
    }
    'kyc-id.html|id-filled' {
      $Body = $Body -replace 'class="form-section-block id-upload-section" id="upload-section"', 'class="form-section-block id-upload-section show" id="upload-section"'
      $Body = $Body -replace 'class="form-section-block ocr-fields" id="ocr-fields"', 'class="form-section-block ocr-fields show" id="ocr-fields"'
      $Body = $Body -replace '(?<=id="upload-section-title">)[^<]*(?=<)', 'Upload your National ID (PhilSys)'
      $idDoneProgress = Get-KycProgressCompleted 1
      $Body = [regex]::Replace($Body, '(?s)<div id="progress-bar">.*?</div>\s*(?=<div class="form-section-block")', "<div id=`"progress-bar`">$idDoneProgress</div>`n      ", 1)
    }
    'order.html|plan-overlay' {
      $Body = $Body -replace 'class="overlay" id="plan-overlay"', 'class="overlay show export-overlay-flat" id="plan-overlay"'
      $Body = $Body -replace '(?<=id="plan-disbursed">)[^<]*(?=<)', "${P}5,000"
      $Body = $Body -replace '(?<=id="plan-total">)[^<]*(?=<)', "${P}6,104"
      $Body = Inject-Element $Body 'plan-installments' $OrderPlanTimeline
    }
    'order.html|interest-overlay' {
      $Body = $Body -replace 'class="overlay" id="interest-overlay"', 'class="overlay show export-overlay-flat" id="interest-overlay"'
    }
    'order.html|payout-picker-overlay' {
      $Body = $Body -replace 'class="overlay" id="payout-picker-overlay"', 'class="overlay show export-overlay-flat" id="payout-picker-overlay"'
      $Body = Inject-Element $Body 'payout-picker-list' $PayoutPickerList
    }
    'order.html|no-payout' {
      $Body = $Body -replace '<p style="font-weight:500;margin-top:4px;" id="payout-display">', '<p class="text-muted" style="margin-top:4px;" id="payout-display">'
      $Body = $Body -replace '(?<=id="payout-display">)[^<]*(?=<)', 'No account linked'
      $Body = $Body -replace '(?<=id="btn-change-payout">)[^<]*(?=<)', 'Add'
    }
    'order.html|agreement-overlay' {
      $Body = $Body -replace 'class="overlay" id="agreement-overlay"', 'class="overlay show export-overlay-flat" id="agreement-overlay"'
      $Body = $Body -replace '<input type="checkbox" id="agree-loan">', '<input type="checkbox" id="agree-loan" checked>'
      $Body = $Body -replace 'id="btn-sign" disabled', 'id="btn-sign"'
    }
    'order-premium.html|plan-overlay' {
      $Body = $Body -replace 'class="overlay" id="plan-overlay"', 'class="overlay show export-overlay-flat" id="plan-overlay"'
      $Body = $Body -replace '(?<=id="plan-disbursed">)[^<]*(?=<)', "${P}15,000"
      $Body = $Body -replace '(?<=id="plan-total">)[^<]*(?=<)', "${P}15,950"
      $Body = Inject-Element $Body 'plan-installments' $OrderPlanTimeline
    }
    'order-premium.html|interest-overlay' {
      $Body = $Body -replace 'class="overlay" id="interest-overlay"', 'class="overlay show export-overlay-flat" id="interest-overlay"'
    }
    'order-premium.html|payout-picker-overlay' {
      $Body = $Body -replace 'class="overlay" id="payout-picker-overlay"', 'class="overlay show export-overlay-flat" id="payout-picker-overlay"'
      $Body = Inject-Element $Body 'payout-picker-list' $PayoutPickerList
    }
    'order-premium.html|no-payout' {
      $Body = $Body -replace '<p style="font-weight:500;margin-top:4px;" id="payout-display">', '<p class="text-muted" style="margin-top:4px;" id="payout-display">'
      $Body = $Body -replace '(?<=id="payout-display">)[^<]*(?=<)', 'No account linked'
      $Body = $Body -replace '(?<=id="btn-change-payout">)[^<]*(?=<)', 'Add'
    }
    'order-premium.html|agreement-overlay' {
      $Body = $Body -replace 'class="overlay" id="agreement-overlay"', 'class="overlay show export-overlay-flat" id="agreement-overlay"'
      $Body = $Body -replace '<input type="checkbox" id="agree-loan">', '<input type="checkbox" id="agree-loan" checked>'
      $Body = $Body -replace 'id="btn-sign" disabled', 'id="btn-sign"'
    }
  }
  return $Body
}

function Remove-ElementById([string]$Html, [string]$Tag, [string]$Id) {
  $pattern = "(?is)<$Tag[^>]*id=`"$Id`"[^>]*>"
  $m = [regex]::Match($Html, $pattern)
  if (-not $m.Success) { return $Html }
  $start = $m.Index
  $pos = $m.Index + $m.Length
  $depth = 1
  while ($pos -lt $Html.Length -and $depth -gt 0) {
    $rest = $Html.Substring($pos)
    $open = [regex]::Match($rest, '(?is)<div[\s>]')
    $close = [regex]::Match($rest, '(?is)</div>')
    if ($open.Success -and (-not $close.Success -or $open.Index -lt $close.Index)) {
      $depth++; $pos += $open.Index + $open.Length
    } elseif ($close.Success) {
      $depth--; $pos += $close.Index + 6
    } else { break }
  }
  return $Html.Remove($start, $pos - $start)
}

$StripOverlays = @{
  'login.html' = @('terms-overlay', 'privacy-overlay')
  'kyc-id.html' = @('more-ids-overlay')
  'order.html' = @('interest-overlay', 'plan-overlay', 'agreement-overlay', 'payout-picker-overlay')
  'order-premium.html' = @('interest-overlay', 'plan-overlay', 'agreement-overlay', 'payout-picker-overlay')
  'bill.html' = @('repay-overlay')
  'bill-current.html' = @('repay-overlay')
}

function Strip-StaticChrome([string]$Body, [string]$File, [string]$Xf) {
  if ($File -eq 'order.html' -or $File -eq 'order-premium.html') {
    $allOverlays = @('interest-overlay', 'plan-overlay', 'agreement-overlay', 'payout-picker-overlay')
    $keep = @()
    if ($Xf -eq 'plan-overlay') { $keep = @('plan-overlay') }
    elseif ($Xf -eq 'agreement-overlay') { $keep = @('agreement-overlay') }
    elseif ($Xf -eq 'interest-overlay') { $keep = @('interest-overlay') }
    elseif ($Xf -eq 'payout-picker-overlay') { $keep = @('payout-picker-overlay') }
    foreach ($oid in $allOverlays) {
      if ($keep -notcontains $oid) { $Body = Remove-ElementById $Body 'div' $oid }
    }
  } elseif ($StripOverlays.ContainsKey($File)) {
    foreach ($oid in $StripOverlays[$File]) {
      $Body = Remove-ElementById $Body 'div' $oid
    }
  }
  $Body = $Body -replace '(?is)<!--[\s\S]*?-->', ''
  $Body = $Body -replace '<div id="home-state-switcher"[^>]*></div>', ''
  return $Body
}

function Convert-SelectsToStatic([string]$Body) {
  $pat = '(?is)<select\s+class="([^"]+)"([^>]*)>(.*?)</select>'
  $eval = {
    param($m)
    $classes = $m.Groups[1].Value
    if ($classes -notmatch '\bform-input\b' -or $classes -notmatch '\bform-select\b') { return $m.Value }
    $attrs = $m.Groups[2].Value
    $inner = $m.Groups[3].Value
    $text = 'Select'
    $muted = $true
    if ($inner -match '<option\s+value=""\s*>([^<]*)</option>') {
      $text = $Matches[1].Trim()
      if (-not $text) { $text = 'Select' }
    } elseif ($inner -match '<option[^>]*selected[^>]*>([^<]*)</option>') {
      $text = $Matches[1].Trim(); $muted = $false
    } elseif ($inner -match '<option[^>]*>([^<]+)</option>') {
      $text = $Matches[1].Trim(); $muted = $false
    }
    $classes = ($classes -replace '\bform-select\b', 'form-select-static').Trim()
    $textCls = if ($muted) { 'form-select-static__text text-muted' } else { 'form-select-static__text' }
    "<div class=`"$classes`"$attrs><span class=`"$textCls`">$text</span><span class=`"form-select-static__caret`" aria-hidden=`"true`">&#9662;</span></div>"
  }
  return [regex]::Replace($Body, $pat, $eval)
}

function Fix-KycPrivacyNote([string]$Body) {
  return [regex]::Replace($Body, '<div id="kyc-privacy-note">', '<div id="kyc-privacy-note" class="kyc-privacy-note">')
}

function Repair-Mojibake([string]$Text) {
  # Fix common PowerShell / Windows-1252 misreads of UTF-8 punctuation
  $Text = $Text -replace '鈥\?', '&#8226;'
  $Text = $Text -replace '路鈥⑩€⑩€\?', '&#183;&#183;&#183;&#183;'
  $Text = $Text -replace 'GCash\s*[^\d<]{2,12}4521', "GCash $Dot$Dot$Dot$Dot 4521"
  $Text = $Text -replace '<span class="dot">[^<]{1,6}</span>', "<span class=`"dot`">$Bull</span>"
  return $Text
}

function Move-OverlaysIntoAppShell([string]$Body) {
  if ($Body -notmatch 'class="overlay') { return $Body }
  return [regex]::Replace($Body, '(?is)(<div class="app-shell[^>]*>)([\s\S]*)(</div>\s*)((?:<div class="overlay\b[\s\S]*?</div>\s*)+)$', '$1$2$4$3', 1)
}

function Normalize-ExportInlineLinks([string]$Body) {
  return [regex]::Replace($Body, '(?is)(<div class="consent-row"[^>]*>[\s\S]*?<label[^>]*>)([\s\S]*?)(</label>)', {
    param($m)
    $inner = $m.Groups[2].Value -replace '<a\s[^>]*>', '<span class="text-link">' -replace '</a>', '</span>'
    "$($m.Groups[1].Value)$inner$($m.Groups[3].Value)"
  })
}

function Normalize-ExportIds([string]$Body, [int]$PageNum) {
  $prefix = "p$('{0:D2}' -f $PageNum)"
  $ids = [regex]::Matches($Body, '\bid="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique | Sort-Object { $_.Length } -Descending
  foreach ($id in $ids) {
    $newId = "$prefix-$id"
    $esc = [regex]::Escape($id)
    $Body = $Body -replace "\bid=`"$esc`"", "id=`"$newId`""
    $Body = $Body -replace "\bfor=`"$esc`"", "for=`"$newId`""
  }
  return $Body
}

function Process-Page([string]$File, [string]$RawHtml, [string]$Xf, [int]$PageNum = 0) {
  $body = Extract-Body $RawHtml
  $body = [regex]::Replace($body, '(?is)<script[\s\S]*?</script>', '')
  $body = [regex]::Replace($body, '(?i)<link[^>]*href=["''][^"'']*app\.css["''][^>]*>', '')
  $body = [regex]::Replace($body, '\sonclick="[^"]*"', '')
  if ($Injections.ContainsKey($File)) {
    foreach ($kv in $Injections[$File].GetEnumerator()) {
      $id = $kv.Key; $html = $kv.Value
      if ($id -eq 'selected-id-label') { $body = Inject-Paragraph $body $id $html }
      else { $body = Inject-Element $body $id $html }
    }
  }
  $body = Apply-Transform $body $File $Xf
  $body = Strip-StaticChrome $body $File $Xf
  $body = Convert-SelectsToStatic $body
  $body = Fix-KycPrivacyNote $body
  $body = Move-OverlaysIntoAppShell $body
  $body = Normalize-ExportInlineLinks $body
  if ($PageNum -gt 0) { $body = Normalize-ExportIds $body $PageNum }
  if ($File -eq 'bill.html') {
    $body = $body -replace 'id="bill-empty" style="display:none;', 'id="bill-empty" style="display:none !important;'
  }
  return (Repair-Mojibake $body)
}

$ExportOverlayCss = @'

.export-shell { contain: none; }
.export-shell .overlay { position: absolute !important; inset: 0 !important; pointer-events: none; opacity: 1 !important; visibility: visible !important; display: flex !important; z-index: 20; }
.export-shell .overlay:not(.show) { display: none !important; }
.export-shell .overlay .sheet { transform: none !important; max-height: 520px !important; min-height: 0 !important; }
.export-shell .export-overlay-flat { align-items: flex-end !important; justify-content: center !important; background: rgba(20,20,19,0.5) !important; }
.export-shell .export-overlay-flat .sheet-half { min-height: 400px !important; max-height: 520px !important; }
.export-shell .export-overlay-flat .sheet:not(.sheet-half) { min-height: 420px !important; max-height: 90% !important; }
.export-shell .consent-row label,
.export-shell .consent-label { flex: 1; min-width: 0; line-height: 1.55; font-size: 14px; }
.export-shell .consent-row .text-link { color: var(--link); white-space: normal; }
.export-shell .form-group,
.export-shell .page-content { min-width: 0; }
'@

$ExportCss = @'

body.journey-root { margin: 0; height: 100vh; overflow: hidden; background: #e8e4e1; display: flex; flex-direction: column; }
.journey-header { padding: 20px 28px 14px; border-bottom: 1px solid rgba(20,20,19,0.08); background: rgba(255,255,255,0.82); flex-shrink: 0; z-index: 1000; }
.journey-title { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
.journey-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
.journey-zoom-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 16px; margin-top: 10px; font-size: 12px; }
.journey-zoom-hint { color: var(--muted); }
.journey-zoom-label { font-weight: 600; color: var(--ink); min-width: 3.5em; }
.journey-zoom-btn { border: 1px solid rgba(20,20,19,0.14); background: var(--white); color: var(--ink); border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: var(--font); }
.journey-zoom-btn:hover { border-color: rgba(20,20,19,0.28); }
.journey-flow { padding: 10px 28px; font-size: 12px; color: var(--muted); line-height: 1.6; border-bottom: 1px solid rgba(20,20,19,0.06); background: #f0ece9; flex-shrink: 0; }
.journey-viewport { flex: 1; min-height: 0; overflow: hidden; position: relative; cursor: grab; touch-action: none; }
.journey-viewport.is-panning { cursor: grabbing; }
.journey-stage { transform-origin: 0 0; will-change: transform; width: max-content; min-width: 100%; }
.journey-grid { display: flex; flex-direction: column; gap: 44px; padding: 28px; }
.journey-row { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.journey-row-head { padding: 0 4px 2px; border-bottom: 1px solid rgba(20,20,19,0.08); }
.journey-row-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--ink); }
.journey-row-sub { font-size: 12px; color: var(--muted); margin: 4px 0 0; }
.journey-row-meta { font-size: 11px; color: var(--muted); margin: 6px 0 0; opacity: 0.9; }
.journey-row-track { display: flex; flex-wrap: nowrap; gap: 28px; align-items: flex-start; overflow: visible; padding: 4px 4px 16px; }
.journey-section { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.journey-step-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); max-width: 430px; padding-left: 4px; line-height: 1.4; }
.journey-step-label strong { color: var(--ink); font-size: 12px; }
.export-shell { width: 430px; border-radius: 28px; overflow: hidden; border: 1px solid rgba(20,20,19,0.1); box-shadow: var(--shadow-atmo); background: var(--canvas); position: relative; isolation: isolate; }
.export-shell .app-shell { max-width: none; margin: 0; min-height: 820px; border-radius: 0; box-shadow: none; border: none; position: relative; }
.export-shell .face-auth-footer { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; transform: none !important; max-width: none !important; }
.export-shell .bottom-nav { position: absolute !important; bottom: calc(16px + var(--safe-bottom)); left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 382px; }
'@ + $ExportOverlayCss + @'

.form-select-static { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: default; background-color: var(--white) !important; background-image: none !important; }
.form-select-static__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-select-static__caret { flex-shrink: 0; font-size: 12px; line-height: 1; color: var(--ink); opacity: 0.72; }
.export-shell select.form-select { background-image: none !important; background-size: 12px 8px; }
'@

$JourneyZoomJs = @'
(function () {
  var viewport = document.getElementById('journey-viewport');
  var stage = document.getElementById('journey-stage');
  var zoomLabel = document.getElementById('journey-zoom-label');
  var btnFit = document.getElementById('journey-zoom-fit');
  var btnReset = document.getElementById('journey-zoom-reset');
  if (!viewport || !stage) return;

  var scale = 1, tx = 0, ty = 0, dragging = false, lx = 0, ly = 0, pointers = new Map();

  function apply() {
    stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';
  }

  function zoomAt(clientX, clientY, nextScale) {
    var r = viewport.getBoundingClientRect();
    var mx = clientX - r.left;
    var my = clientY - r.top;
    var ns = Math.min(3, Math.max(0.12, nextScale));
    var wx = (mx - tx) / scale;
    var wy = (my - ty) / scale;
    scale = ns;
    tx = mx - wx * scale;
    ty = my - wy * scale;
    apply();
  }

  function fitView() {
    var pad = 28;
    stage.style.transform = 'none';
    var sw = stage.offsetWidth;
    var sh = stage.offsetHeight;
    var vw = viewport.clientWidth - pad * 2;
    var vh = viewport.clientHeight - pad * 2;
    scale = Math.min(1, Math.min(vw / sw, vh / sh));
    tx = pad + Math.max(0, (vw - sw * scale) / 2);
    ty = pad + Math.max(0, (vh - sh * scale) / 2);
    apply();
  }

  function resetView() {
    scale = 1;
    tx = 28;
    ty = 28;
    apply();
  }

  viewport.addEventListener('wheel', function (e) {
    e.preventDefault();
    var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomAt(e.clientX, e.clientY, scale * factor);
  }, { passive: false });

  viewport.addEventListener('mousedown', function (e) {
    if (e.button !== 0 && e.button !== 1) return;
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    viewport.classList.add('is-panning');
    e.preventDefault();
  });

  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    tx += e.clientX - lx;
    ty += e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    apply();
  });

  window.addEventListener('mouseup', function () {
    dragging = false;
    viewport.classList.remove('is-panning');
  });

  viewport.addEventListener('pointerdown', function (e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  viewport.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size !== 2) return;
    var pts = Array.from(pointers.values());
    var dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (!viewport._pinchDist) { viewport._pinchDist = dist; return; }
    var cx = (pts[0].x + pts[1].x) / 2;
    var cy = (pts[0].y + pts[1].y) / 2;
    zoomAt(cx, cy, scale * (dist / viewport._pinchDist));
    viewport._pinchDist = dist;
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) viewport._pinchDist = 0;
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);

  if (btnFit) btnFit.addEventListener('click', fitView);
  if (btnReset) btnReset.addEventListener('click', resetView);
  window.addEventListener('resize', fitView);
  fitView();
})();
'@

$flowZhPath = Join-Path $Root 'scripts\journey-flow-zh.txt'
$phaseZhPath = Join-Path $Root 'scripts\journey-phases-zh.txt'
$flowZh = if (Test-Path $flowZhPath) { [IO.File]::ReadAllText($flowZhPath, [Text.Encoding]::UTF8).Trim() } else { '' }
$phaseZhLines = if (Test-Path $phaseZhPath) {
  @([IO.File]::ReadAllText($phaseZhPath, [Text.Encoding]::UTF8) -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
} else { @() }
$flowText = 'Install / Launch &gt; Home &gt; Register &gt; KYC &gt; Credit Review &gt; Borrow &gt; Listing Review &gt; Disbursement &gt; Repayment'
if ($flowZh) { $flowText = "$flowZh<br>$flowText" }

function New-JourneyCard([hashtable]$Item, [string]$Body) {
  $nn = '{0:D2}' -f $Item.n
  $slug = "$($Item.file)-$($Item.xf)" -replace '\|$','' -replace '\|','-'
  if (-not $Item.xf) { $slug = $Item.file -replace '\.html$','' }
  @"
    <div class="journey-section" id="journey-$slug">
      <div class="journey-step-label"><strong>$nn. $($Item.stage)</strong> - $($Item.file)</div>
      <div class="export-shell">$Body</div>
    </div>
"@
}

$cardsByPhase = @{ 1=@(); 2=@(); 3=@(); 4=@(); 5=@() }
foreach ($item in $Journey) {
  $file = $item.file; $xf = $item.xf
  $path = Join-Path $Root $file
  if (-not (Test-Path $path)) { continue }
  $raw = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $body = Process-Page $file $raw $xf $item.n
  $cardsByPhase[$item.phase] += (New-JourneyCard $item $body)
}

$rows = foreach ($phase in $Phases) {
  $phaseId = $phase.id
  $labelZh = if ($phaseZhLines.Count -ge $phaseId) { $phaseZhLines[$phaseId - 1] } else { $phase.labelEn }
  $count = $cardsByPhase[$phaseId].Count
  $screens = $cardsByPhase[$phaseId] -join "`n"
  @"
  <section class="journey-row" id="journey-row-$phaseId">
    <div class="journey-row-head">
      <h2 class="journey-row-title">$phaseId. $labelZh</h2>
      <p class="journey-row-sub">$($phase.labelEn)</p>
      <p class="journey-row-meta">$count screens</p>
    </div>
    <div class="journey-row-track">
$screens
    </div>
  </section>
"@
}

$cards = $rows

$output = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KitaMo - User Journey Export ($($Journey.Count) screens)</title>
  <style>
$Css
$ExportCss
  </style>
</head>
<body class="journey-root">
  <div class="journey-header">
    <div class="journey-title">KitaMo - User Journey (PRD / Modao)</div>
    <div class="journey-sub">$($Journey.Count) screens | 5 phases | inline CSS</div>
    <div class="journey-zoom-bar">
      <span class="journey-zoom-hint">Scroll to zoom &middot; Drag to pan &middot; Pinch on trackpad</span>
      <span class="journey-zoom-label" id="journey-zoom-label">100%</span>
      <button type="button" class="journey-zoom-btn" id="journey-zoom-fit">Fit view</button>
      <button type="button" class="journey-zoom-btn" id="journey-zoom-reset">100%</button>
    </div>
  </div>
  <div class="journey-flow">$flowText</div>
  <div class="journey-viewport" id="journey-viewport">
    <div class="journey-stage" id="journey-stage">
      <div class="journey-grid">
$($cards -join "`n")
      </div>
    </div>
  </div>
  <script>$JourneyZoomJs</script>
</body>
</html>
"@

$output = Repair-Mojibake $output

$outPath = Join-Path $Root 'journey-export.html'
$utf8 = New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText($outPath, $output, $utf8)
Write-Host "Wrote $outPath ($($Journey.Count) screens, $([math]::Round($output.Length/1024)) KB)"

# --- modao-import.html: same phase layout as journey-export, no JS, no meta chrome ---
$ModaoImportCss = @'

body.modao-root { margin: 0; background: #e8e4e1; color: var(--ink); overflow: auto; }
.modao-grid { display: flex; flex-direction: column; gap: 44px; padding: 28px; width: max-content; min-width: 100%; }
.journey-row { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.journey-row-head { padding: 0 4px 2px; border-bottom: 1px solid rgba(20,20,19,0.08); }
.journey-row-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--ink); }
.journey-row-sub { font-size: 12px; color: var(--muted); margin: 4px 0 0; }
.journey-row-track { display: flex; flex-wrap: nowrap; gap: 28px; align-items: flex-start; overflow: visible; padding: 4px 4px 16px; }
.journey-section { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.journey-step-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); max-width: 430px; padding-left: 4px; line-height: 1.4; }
.journey-step-label strong { color: var(--ink); font-size: 12px; }
.export-shell { width: 430px; border-radius: 28px; overflow: hidden; border: 1px solid rgba(20,20,19,0.1); box-shadow: var(--shadow-atmo); background: var(--canvas); position: relative; isolation: isolate; }
.export-shell .app-shell { max-width: none; margin: 0; min-height: 820px; border-radius: 0; box-shadow: none; border: none; position: relative; }
.export-shell .face-auth-footer { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; transform: none !important; max-width: none !important; }
.export-shell .bottom-nav { position: absolute !important; bottom: calc(16px + var(--safe-bottom)); left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 382px; }
'@ + $ExportOverlayCss + @'

.form-select-static { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: default; background-color: var(--white) !important; background-image: none !important; }
.form-select-static__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-select-static__caret { flex-shrink: 0; font-size: 12px; line-height: 1; color: var(--ink); opacity: 0.72; }
.export-shell select.form-select { background-image: none !important; background-size: 12px 8px; }
'@

function New-ModaoCard([hashtable]$Item, [string]$Body) {
  $nn = '{0:D2}' -f $Item.n
  @"
    <div class="journey-section" id="page-$nn">
      <div class="journey-step-label"><strong>$nn. $($Item.stage)</strong></div>
      <div class="export-shell">$Body</div>
    </div>
"@
}

function New-ModaoHomeStateCard([hashtable]$Item, [string]$Body, [string]$Label) {
  @"
    <div class="journey-section" id="home-state-$($Item.slug)">
      <div class="journey-step-label"><strong>$Label</strong></div>
      <div class="export-shell">$Body</div>
    </div>
"@
}

$modaoCardsByPhase = @{ 1=@(); 2=@(); 3=@(); 4=@(); 5=@() }
foreach ($item in $Journey) {
  $file = $item.file; $xf = $item.xf
  $path = Join-Path $Root $file
  if (-not (Test-Path $path)) { continue }
  $raw = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $body = Process-Page $file $raw $xf $item.n
  $modaoCardsByPhase[$item.phase] += (New-ModaoCard $item $body)
}

$modaoRows = foreach ($phase in $Phases) {
  $phaseId = $phase.id
  $labelZh = if ($phaseZhLines.Count -ge $phaseId) { $phaseZhLines[$phaseId - 1] } else { $phase.labelEn }
  $screens = $modaoCardsByPhase[$phaseId] -join "`n"
  @"
  <section class="journey-row" id="modao-row-$phaseId">
    <div class="journey-row-head">
      <h2 class="journey-row-title">$phaseId. $labelZh</h2>
      <p class="journey-row-sub">$($phase.labelEn)</p>
    </div>
    <div class="journey-row-track">
$screens
    </div>
  </section>
"@
}

$homeStateZhPath = Join-Path $Root 'scripts\journey-home-states-zh.txt'
$homeStateZhAll = if (Test-Path $homeStateZhPath) {
  @([IO.File]::ReadAllText($homeStateZhPath, [Text.Encoding]::UTF8) -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
} else { @() }
$homeStateZhTitle = if ($homeStateZhAll.Count -gt 0) { $homeStateZhAll[0] } else { '' }
$homeStateZhLabels = if ($homeStateZhAll.Count -gt 1) { $homeStateZhAll[1..($homeStateZhAll.Count - 1)] } else { @() }

$modaoHomeStateCards = foreach ($hs in $HomeStates) {
  $file = $hs.file; $xf = $hs.xf
  $path = Join-Path $Root $file
  if (-not (Test-Path $path)) { continue }
  $raw = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $body = Process-Page $file $raw $xf $hs.id
  $idx = [array]::IndexOf(($HomeStates | ForEach-Object { $_.slug }), $hs.slug)
  $label = if ($homeStateZhLabels.Count -gt $idx) { $homeStateZhLabels[$idx] } else { $hs.labelEn }
  New-ModaoHomeStateCard $hs $body $label
}

$modaoHomeStatesTitle = if ($homeStateZhTitle) { $homeStateZhTitle } else { 'Home states' }

$modaoHomeStatesRow = @"
  <section class="journey-row" id="modao-row-home-states">
    <div class="journey-row-head">
      <h2 class="journey-row-title">$modaoHomeStatesTitle</h2>
      <p class="journey-row-sub">Home states</p>
    </div>
    <div class="journey-row-track">
$($modaoHomeStateCards -join "`n")
    </div>
  </section>
"@

$modaoOutput = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KitaMo</title>
  <style>
$Css
$ModaoImportCss
  </style>
</head>
<body class="modao-root">
  <main class="modao-grid">
$($modaoRows -join "`n")
$modaoHomeStatesRow
  </main>
</body>
</html>
"@

$modaoOutput = Repair-Mojibake $modaoOutput
$modaoPath = Join-Path $Root 'modao-import.html'
[IO.File]::WriteAllText($modaoPath, $modaoOutput, $utf8)
Write-Host "Wrote $modaoPath ($($Journey.Count) screens, $([math]::Round($modaoOutput.Length/1024)) KB)"

# --- modao2-import.html: supplemental screens, inlined CSS for Modao import ---
$Modao2LayoutCss = @'

body.modao-root { margin: 0; background: #e8e4e1; color: var(--ink); overflow: auto; }
.modao-grid { display: flex; flex-direction: column; gap: 44px; padding: 28px; width: max-content; min-width: 100%; }
.journey-row { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.journey-row-head { padding: 0 4px 2px; border-bottom: 1px solid rgba(20,20,19,0.08); }
.journey-row-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--ink); }
.journey-row-sub { font-size: 12px; color: var(--muted); margin: 4px 0 0; }
.journey-row-track { display: flex; flex-wrap: nowrap; gap: 28px; align-items: flex-start; overflow: visible; padding: 4px 4px 16px; }
.journey-section { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
.journey-step-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); max-width: 430px; padding-left: 4px; line-height: 1.4; }
.journey-step-label strong { color: var(--ink); font-size: 12px; }
.journey-step-label .drools-tag { display: block; font-weight: 450; text-transform: none; letter-spacing: 0; color: var(--consent); margin-top: 2px; font-size: 10px; }
.export-shell { width: 430px; border-radius: 28px; overflow: hidden; border: 1px solid rgba(20,20,19,0.1); box-shadow: var(--shadow-atmo); background: var(--canvas); position: relative; isolation: isolate; }
.export-shell .app-shell { max-width: none; margin: 0; min-height: 820px; border-radius: 0; box-shadow: none; border: none; position: relative; }
.export-shell .face-auth-footer { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; transform: none !important; max-width: none !important; }
.export-shell .bottom-nav { position: absolute !important; bottom: calc(16px + var(--safe-bottom)); left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 382px; }
'@ + $ExportOverlayCss + @'

.form-select-static { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: default; background-color: var(--white) !important; background-image: none !important; }
.form-select-static__text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-select-static__caret { flex-shrink: 0; font-size: 12px; line-height: 1; color: var(--ink); opacity: 0.72; }
'@

$Modao2OrderManifestPath = Join-Path $PSScriptRoot 'modao2-order-manifest.json'
$Modao2OrderScreens = if (Test-Path $Modao2OrderManifestPath) {
  $json = [IO.File]::ReadAllText($Modao2OrderManifestPath, [Text.Encoding]::UTF8)
  @(ConvertFrom-Json $json)
} else { @() }

function New-Modao2Card($Item, [string]$Body) {
  $tag = if ($Item.tag) { "<span class=`"drools-tag`">$($Item.tag)</span>" } else { '' }
  @"
    <div class="journey-section" id="$($Item.sectionId)">
      <div class="journey-step-label"><strong>$($Item.label)</strong>$tag</div>
      <div class="export-shell">$Body</div>
    </div>
"@
}

$modao2OrderCards = foreach ($item in $Modao2OrderScreens) {
  $path = Join-Path $Root $item.file
  if (-not (Test-Path $path)) { continue }
  $raw = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $xf = if ($item.xf) { [string]$item.xf } else { $null }
  $body = Process-Page $item.file $raw $xf $item.n
  New-Modao2Card $item $body
}

$modao2OrderRow = @"
    <!-- C. 发标 -->
    <section class="journey-row" id="modao2-row-order">
      <div class="journey-row-head">
        <h2 class="journey-row-title">C. 发标</h2>
        <p class="journey-row-sub">order.html · order-premium.html · F16–F19</p>
      </div>
      <div class="journey-row-track">
$($modao2OrderCards -join "`n")
      </div>
    </section>
"@

$Modao2LoanRejectManifestPath = Join-Path $PSScriptRoot 'modao2-loan-reject-manifest.json'
$Modao2LoanRejectScreens = if (Test-Path $Modao2LoanRejectManifestPath) {
  $json = [IO.File]::ReadAllText($Modao2LoanRejectManifestPath, [Text.Encoding]::UTF8)
  @(ConvertFrom-Json $json)
} else { @() }

$modao2LoanRejectCards = foreach ($item in $Modao2LoanRejectScreens) {
  $path = Join-Path $Root $item.file
  if (-not (Test-Path $path)) { continue }
  $raw = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  $xf = if ($item.xf) { [string]$item.xf } else { $null }
  $body = Process-Page $item.file $raw $xf $item.n
  New-Modao2Card $item $body
}

$modao2LoanRejectRow = ''
if ($modao2LoanRejectCards.Count -gt 0) {
  $modao2LoanRejectRow = @"
    <!-- E. 发标被拒 · 放款失败 -->
    <section class="journey-row" id="modao2-row-loan-reject">
      <div class="journey-row-head">
        <h2 class="journey-row-title">E. 发标被拒 · 放款失败</h2>
        <p class="journey-row-sub">listing-rejected.html · disbursement-failed.html · F20–F21</p>
      </div>
      <div class="journey-row-track">
$($modao2LoanRejectCards -join "`n")
      </div>
    </section>
"@
}

$modao2BodyPath = Join-Path $PSScriptRoot 'modao2-body.fragment.html'
$modao2Fragment = if (Test-Path $modao2BodyPath) {
  [IO.File]::ReadAllText($modao2BodyPath, [Text.Encoding]::UTF8).Trim()
} else { '' }

$modao2Body = ''
if ($modao2Fragment) {
  if ($modao2Fragment -match '(?s)(.*)(    <!-- D\. 首页态补充 -->.*)') {
    $modao2Body = ($Matches[1].TrimEnd() + "`n`n" + $modao2OrderRow + "`n`n" + $Matches[2]).Trim()
  } else {
    $modao2Body = ($modao2Fragment + "`n`n" + $modao2OrderRow).Trim()
  }
  if ($modao2LoanRejectRow) {
    $modao2Body = ($modao2Body.TrimEnd() + "`n`n" + $modao2LoanRejectRow).Trim()
  }
}

if ($modao2Body) {
  $modao2Output = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KitaMo</title>
  <style>
$Css
$Modao2LayoutCss
  </style>
</head>
<body class="modao-root">
  <main class="modao-grid">
$modao2Body
  </main>
</body>
</html>
"@
  $modao2Output = Repair-Mojibake $modao2Output
  $modao2Path = Join-Path $Root 'modao2-import.html'
  [IO.File]::WriteAllText($modao2Path, $modao2Output, $utf8)
  Write-Host "Wrote $modao2Path ($($Modao2OrderScreens.Count) order + $($Modao2LoanRejectScreens.Count) loan-reject screens + supplement, $([math]::Round($modao2Output.Length/1024)) KB)"
}
