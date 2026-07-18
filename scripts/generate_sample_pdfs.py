"""Generates two sample PDFs for testing the AI Document Chat app."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem

styles = getSampleStyleSheet()
body = ParagraphStyle('body', parent=styles['Normal'], fontSize=10.5, leading=15, spaceAfter=8)
h1 = styles['Heading1']
h2 = styles['Heading2']


def build_remote_work_policy(path):
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.9 * inch, bottomMargin=0.9 * inch)
    story = []

    story.append(Paragraph('Remote Work Policy Handbook', styles['Title']))
    story.append(Paragraph('Northwind Digital Solutions \u2014 Effective January 2026', body))
    story.append(Spacer(1, 16))

    story.append(Paragraph('1. Purpose', h1))
    story.append(Paragraph(
        'This handbook defines the standards, expectations, and support structures for employees '
        'working outside of a traditional office environment. It applies to all full-time and '
        'part-time staff who have been approved for remote or hybrid work arrangements.', body))

    story.append(Paragraph('2. Eligibility', h1))
    story.append(Paragraph(
        'Employees become eligible for remote work after completing a 90-day probationary period '
        'in their role. Eligibility is not automatic; it requires manager approval based on role '
        'responsibilities, historical performance, and the nature of the work involved. Customer-facing '
        'roles requiring on-site presence, such as front-desk operations, are generally not eligible.', body))

    story.append(Paragraph('3. Work Schedule and Availability', h1))
    story.append(Paragraph(
        'Remote employees are expected to maintain core availability hours between 10:00 AM and 3:00 PM '
        'in their local time zone, during which they should be reachable via Slack or email within 30 minutes. '
        'Outside of core hours, employees may arrange flexible schedules with their manager, provided '
        'weekly output and meeting commitments are met.', body))
    story.append(Paragraph(
        'Employees working across time zones more than 4 hours from their team\u2019s primary zone must '
        'submit a Flexible Schedule Agreement to HR for approval before their first remote month.', body))

    story.append(Paragraph('4. Equipment and Reimbursement', h1))
    story.append(Paragraph(
        'The company provides a one-time home office stipend of $750 for new remote employees, covering '
        'items such as monitors, ergonomic chairs, and desks. Internet reimbursement is capped at $50 per '
        'month with a submitted receipt. Company-issued laptops remain company property and must be '
        'returned within 10 business days of employment ending.', body))

    story.append(PageBreak())

    story.append(Paragraph('5. Security Requirements', h1))
    story.append(Paragraph(
        'All remote employees must use company-managed VPN software when accessing internal systems. '
        'Personal devices may not be used to access customer data under any circumstances. Two-factor '
        'authentication is mandatory for all company accounts, and screens must be locked whenever '
        'a workstation is unattended, including in home offices.', body))

    story.append(Paragraph('6. Performance Expectations', h1))
    story.append(Paragraph(
        'Remote work is evaluated using the same performance criteria as in-office work: quality of '
        'output, meeting of deadlines, and collaboration effectiveness. Managers conduct monthly '
        'one-on-one check-ins, and remote employees receive the same promotion and review timelines '
        'as their in-office counterparts.', body))

    story.append(Paragraph('7. Communication Norms', h1))
    story.append(ListFlowable([
        ListItem(Paragraph('Default to asynchronous communication for non-urgent matters.', body)),
        ListItem(Paragraph('Use video calls for discussions requiring nuance or complex decision-making.', body)),
        ListItem(Paragraph('Document decisions made in calls within 24 hours in the shared team wiki.', body)),
        ListItem(Paragraph('Respond to direct messages within one business day, except during approved leave.', body)),
    ], bulletType='bullet'))

    story.append(Paragraph('8. Termination of Remote Arrangement', h1))
    story.append(Paragraph(
        'The company reserves the right to revoke remote work privileges with 30 days\u2019 written notice '
        'if performance concerns arise, business needs change, or security policies are repeatedly violated. '
        'Employees may also request to return to in-office work at any time by notifying their manager and HR.', body))

    doc.build(story)


def build_saas_metrics_report(path):
    doc = SimpleDocTemplate(path, pagesize=letter, topMargin=0.9 * inch, bottomMargin=0.9 * inch)
    story = []

    story.append(Paragraph('Q4 2025 SaaS Performance Report', styles['Title']))
    story.append(Paragraph('Prepared by the Revenue Operations Team \u2014 January 8, 2026', body))
    story.append(Spacer(1, 16))

    story.append(Paragraph('Executive Summary', h1))
    story.append(Paragraph(
        'In Q4 2025, the company grew Annual Recurring Revenue (ARR) to $18.4 million, a 22% increase '
        'quarter-over-quarter. Net revenue retention improved to 114%, driven primarily by expansion '
        'revenue within the Enterprise tier. Customer acquisition cost (CAC) payback period shortened '
        'from 14 months to 11 months following the launch of the self-serve onboarding flow in October.', body))

    story.append(Paragraph('Key Metrics', h1))
    story.append(Paragraph('Annual Recurring Revenue (ARR): $18.4 million, up from $15.1 million in Q3 2025.', body))
    story.append(Paragraph('Net Revenue Retention (NRR): 114%, up from 108% in Q3 2025.', body))
    story.append(Paragraph('Gross Churn Rate: 2.1% monthly, down from 2.8% in Q3 2025.', body))
    story.append(Paragraph('Customer Acquisition Cost (CAC): $4,200 per Enterprise customer, $380 per Self-Serve customer.', body))
    story.append(Paragraph('Total Active Customers: 1,847, an increase of 203 net-new customers in the quarter.', body))

    story.append(PageBreak())

    story.append(Paragraph('Segment Performance', h1))
    story.append(Paragraph('Enterprise Tier', h2))
    story.append(Paragraph(
        'The Enterprise segment contributed $11.2 million of total ARR, growing 18% quarter-over-quarter. '
        'This growth was driven by 14 new logo wins, including three Fortune 500 accounts, and expansion '
        'contracts within the existing customer base averaging a 31% seat increase upon renewal.', body))

    story.append(Paragraph('Mid-Market Tier', h2))
    story.append(Paragraph(
        'Mid-Market ARR reached $5.1 million, up 26% from Q3. The sales team attributes this acceleration '
        'to the new usage-based pricing model introduced in September, which lowered the barrier to entry '
        'for teams between 20 and 100 seats.', body))

    story.append(Paragraph('Self-Serve Tier', h2))
    story.append(Paragraph(
        'Self-Serve ARR grew to $2.1 million, a 34% increase, following the October launch of automated '
        'onboarding. Conversion from trial to paid improved from 9% to 15% over the quarter.', body))

    story.append(Paragraph('Risks and Watch Items', h1))
    story.append(ListFlowable([
        ListItem(Paragraph('Support ticket volume grew 40%, outpacing headcount growth in the support team.', body)),
        ListItem(Paragraph('Two Enterprise renewals in Q1 2026 are flagged as at-risk due to executive sponsor turnover.', body)),
        ListItem(Paragraph('Infrastructure costs rose 12% due to increased usage-based tier adoption.', body)),
    ], bulletType='bullet'))

    story.append(Paragraph('Outlook for Q1 2026', h1))
    story.append(Paragraph(
        'The team is targeting $21 million in ARR by the end of Q1 2026, representing 14% sequential growth. '
        'This will be driven by the planned launch of the Team Analytics add-on in February and continued '
        'investment in the Mid-Market sales motion.', body))

    doc.build(story)


if __name__ == '__main__':
    import os
    os.makedirs('sample-pdfs', exist_ok=True)
    build_remote_work_policy('sample-pdfs/remote-work-policy.pdf')
    build_saas_metrics_report('sample-pdfs/q4-saas-metrics-report.pdf')
    print('Sample PDFs created.')
