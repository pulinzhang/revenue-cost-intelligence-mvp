Revenue & Cost Intelligence Platform

MVP Technical Specification

1. Project Overview
1.1 Objective

Build a secure, Azure-hosted financial analytics web application that enables marketing/operational agencies to:

Analyze revenue and cost data

Monitor financial KPIs

Perform margin and break-even analysis

Manage selected financial entries

Access the system via SSO or local authentication

The data pipeline is pre-built. The application layer (API + frontend) will be implemented on top of an existing PostgreSQL database hosted on Azure.

2. System Architecture
2.1 Architecture Style

Monolithic full-stack architecture using Next.js.

Frontend and backend in a single codebase

REST API via Next.js API routes

Azure App Service deployment

PostgreSQL on Azure

2.2 Technology Stack
Frontend

Next.js (App Router)

TypeScript

AG Grid Community Edition

Recharts (data visualization)

Tailwind CSS (UI styling)

Backend

Next.js API Routes

Node.js runtime

node-postgres (pg) for database access

Raw SQL queries (no heavy ORM)

Authentication

next-auth

Azure Active Directory (SSO via OpenID Connect)

Credentials Provider (email/password login)

JWT-based session strategy

Database

PostgreSQL (Azure hosted)

Deployment

Azure App Service

GitHub Actions CI/CD

Environment variables via Azure Configuration

3. Functional Requirements
3.1 Authentication & Security
3.1.1 Login Methods

System shall support:

Azure AD SSO login

Email + Password login

3.1.2 Azure SSO

OpenID Connect

Tenant-based authentication

ID token validation

Automatic user provisioning (if not exists in DB)

3.1.3 Local Authentication

Email-based registration

Password hashed using bcrypt

Secure session handling

JWT session storage

3.1.4 Access Control

All application routes require authentication

API endpoints validate JWT session

Role-based control (MVP simple version):

user

admin

3.2 Dashboard Module
3.2.1 KPI Metrics

System shall compute and display:

Total Revenue

Total Cost

Gross Margin

Gross Margin %

Fixed Cost

Variable Cost

Break-even Point

3.2.2 Filtering

Dashboard must support:

Date range filter

Region filter

Shop/Agency filter

3.2.3 Charts

Revenue trend (line chart)

Cost structure (bar or pie)

Revenue by region/shop (bar chart)

3.3 Financial Detail Module
3.3.1 Data Table

Using AG Grid:

Columns:

Date

Shop / Agency

Region

Product

Revenue

Fixed Cost

Variable Cost

Total Cost

Gross Margin

3.3.2 Features

Server-side pagination

Sorting

Filtering

Export to CSV

Aggregated footer totals

3.4 Data Entry Module

Purpose:

Allow finance team to manually input:

Fixed cost adjustments

Budget values

Manual corrections

Features:

Form validation

Secure submission

Audit timestamp

Linked to authenticated user

4. Business Logic Specifications
4.1 Revenue Aggregation
SELECT region, shop_id, DATE_TRUNC('month', date) AS month,
       SUM(revenue) AS total_revenue
FROM transactions
GROUP BY region, shop_id, month;
4.2 Cost Calculation
Total Cost = Fixed Cost + Variable Cost
4.3 Gross Margin
Gross Margin = Revenue - Total Cost
4.4 Gross Margin %
Gross Margin % = (Revenue - Total Cost) / Revenue
4.5 Break-even Analysis
Break-even = Fixed Cost / (1 - VariableCostRatio)

Where:

VariableCostRatio = Variable Cost / Revenue
5. Database Schema (MVP)
5.1 Core Tables
transactions

id

date

shop_id

region

product

revenue

fixed_cost

variable_cost

users

id (UUID)

email

password_hash (nullable for Azure users)

provider (azure/local)

role

created_at

manual_entries

id

type

amount

description

created_by

created_at

6. API Specification

Base path:

/api/

Endpoints:

Authentication

Handled via next-auth

Dashboard

GET /api/dashboard/summary

GET /api/dashboard/trends

Financial Details

GET /api/finance/list

Supports pagination & filters

Data Entry

POST /api/entries/create

GET /api/entries/list

All endpoints require authenticated session.

7. Non-Functional Requirements
7.1 Performance

Support up to 1M records

Server-side pagination

Query execution under 500ms for aggregated queries

7.2 Security

HTTPS only

Secure cookies

Environment variables protected

No sensitive data exposed to frontend

7.3 Scalability

Azure App Service scaling ready

Stateless API

Database connection pooling

8. Deployment Architecture

User
↓
Azure AD (optional)
↓
Next.js App (Azure App Service)
↓
PostgreSQL (Azure)

CI/CD:

GitHub → GitHub Actions → Azure Deployment

9. MVP Scope Limitations

Not included:

Multi-tenant SaaS

Advanced RBAC

Budget forecasting models

AI analytics

Mobile app

Complex workflow engine

10. Estimated Development Phases

Phase 1 – Setup & Authentication
Phase 2 – Dashboard & KPI
Phase 3 – Financial Table
Phase 4 – Data Entry
Phase 5 – Testing & Deployment

11. Deliverables

Production-ready web application

Source code repository

Database schema

Deployment pipeline

Basic technical documentation

Final Definition

Revenue & Cost Intelligence Platform (MVP) is a secure Azure-hosted financial analytics system providing revenue, cost, margin, and break-even insights with enterprise SSO and local authentication support.