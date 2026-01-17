#!/usr/bin/env python3
"""
Reddit Niche Research Tool
Find SaaS opportunities by analyzing Reddit communities

Usage:
    python main.py research <niche>
    python main.py discover <niche>
    python main.py analyze <subreddit>
"""

import argparse
import json
import os
from datetime import datetime

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

from src.researcher import NicheResearcher
from src.api_client import RedditAPIClient
from src.niche_analyzer import NicheAnalyzer

console = Console()


def display_subreddits(subreddits: list):
    """Display subreddits in a nice table"""
    table = Table(title="Discovered Subreddits", show_lines=True)
    table.add_column("Subreddit", style="cyan", no_wrap=True)
    table.add_column("Subscribers", justify="right", style="green")
    table.add_column("Description", style="white", max_width=50)
    
    for sub in subreddits:
        table.add_row(
            f"r/{sub['name']}",
            f"{sub.get('subscribers', 0):,}",
            sub.get('description', '')[:100] + "..."
        )
    
    console.print(table)


def display_insights(report):
    """Display research insights"""
    
    # Pain Points
    if report.pain_points:
        console.print(Panel.fit(
            "\n".join([f"• {p[:100]}" for p in report.pain_points[:10]]),
            title="🔥 Top Pain Points",
            border_style="red"
        ))
    
    # Questions
    if report.questions:
        console.print(Panel.fit(
            "\n".join([f"• {q[:100]}" for q in report.questions[:10]]),
            title="❓ Common Questions",
            border_style="yellow"
        ))
    
    # Requests
    if report.requests:
        console.print(Panel.fit(
            "\n".join([f"• {r[:100]}" for r in report.requests[:10]]),
            title="✨ Feature Requests",
            border_style="blue"
        ))
    
    # Solutions Mentioned
    if report.solutions_mentioned:
        console.print(Panel.fit(
            "\n".join([f"• {s[:100]}" for s in report.solutions_mentioned[:10]]),
            title="🛠️ Existing Solutions Mentioned",
            border_style="green"
        ))
    
    # Common Themes
    if report.common_themes:
        console.print(Panel.fit(
            ", ".join(report.common_themes),
            title="📊 Common Themes",
            border_style="magenta"
        ))


def display_opportunities(opportunities: list):
    """Display SaaS opportunities"""
    table = Table(title="💡 Potential SaaS Opportunities", show_lines=True)
    table.add_column("Type", style="cyan", width=15)
    table.add_column("Signal", style="yellow", max_width=50)
    table.add_column("Opportunity", style="green", max_width=40)
    
    for opp in opportunities[:15]:
        table.add_row(
            opp.get('type', ''),
            opp.get('signal', '')[:80],
            opp.get('opportunity', '')[:60]
        )
    
    console.print(table)


def cmd_research(args):
    """Full niche research command"""
    console.print(f"\n[bold blue]🚀 Researching niche: {args.niche}[/bold blue]\n")
    
    researcher = NicheResearcher()
    report = researcher.research_niche(
        args.niche,
        max_subreddits=args.max_subs,
        posts_per_subreddit=args.posts
    )
    
    if not report:
        console.print("[red]No results found. Try different keywords.[/red]")
        return
    
    # Display results
    console.print("\n")
    display_subreddits(report.subreddits_found)
    console.print("\n")
    display_insights(report)
    console.print("\n")
    display_opportunities(report.saas_opportunities)
    
    # Save report
    os.makedirs('reports', exist_ok=True)
    filename = f"reports/{args.niche.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report.to_json(filename)
    console.print(f"\n[green]📁 Report saved to: {filename}[/green]")


def cmd_discover(args):
    """Discover subreddits for a niche"""
    console.print(f"\n[bold blue]🔍 Discovering subreddits for: {args.niche}[/bold blue]\n")
    
    researcher = NicheResearcher()
    subreddits = researcher.discover_subreddits(args.niche, max_subreddits=args.limit)
    
    if subreddits:
        display_subreddits(subreddits)
        
        # Save to file
        os.makedirs('reports', exist_ok=True)
        filename = f"reports/subreddits_{args.niche.replace(' ', '_')}.json"
        with open(filename, 'w') as f:
            json.dump(subreddits, f, indent=2)
        console.print(f"\n[green]📁 Saved to: {filename}[/green]")
    else:
        console.print("[red]No subreddits found.[/red]")


def cmd_analyze(args):
    """Analyze a specific subreddit"""
    console.print(f"\n[bold blue]📊 Analyzing r/{args.subreddit}[/bold blue]\n")
    
    researcher = NicheResearcher()
    analysis = researcher.analyze_subreddit(args.subreddit, post_limit=args.posts)
    
    # Display results
    console.print(f"Posts analyzed: {analysis['posts_analyzed']}")
    console.print(f"\nPost Categories: {analysis['post_categories']}")
    
    insights = analysis['insights']
    
    if insights.get('pain_points'):
        console.print(Panel.fit(
            "\n".join([f"• {p[:100]}" for p in insights['pain_points'][:10]]),
            title="🔥 Pain Points",
            border_style="red"
        ))
    
    if insights.get('questions'):
        console.print(Panel.fit(
            "\n".join([f"• {q[:100]}" for q in insights['questions'][:10]]),
            title="❓ Questions",
            border_style="yellow"
        ))
    
    if analysis.get('themes'):
        console.print(Panel.fit(
            ", ".join(analysis['themes']),
            title="📊 Common Themes",
            border_style="magenta"
        ))
    
    # Save
    os.makedirs('reports', exist_ok=True)
    filename = f"reports/analysis_{args.subreddit}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(analysis, f, indent=2, default=str)
    console.print(f"\n[green]📁 Report saved to: {filename}[/green]")


def main():
    parser = argparse.ArgumentParser(
        description="Reddit Niche Research Tool - Find SaaS opportunities",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py research "email marketing"
  python main.py discover "project management" --limit 20
  python main.py analyze entrepreneur --posts 100
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Research command
    research_parser = subparsers.add_parser('research', help='Full niche research')
    research_parser.add_argument('niche', type=str, help='Niche to research')
    research_parser.add_argument('--max-subs', type=int, default=5, help='Max subreddits to analyze')
    research_parser.add_argument('--posts', type=int, default=50, help='Posts per subreddit')
    research_parser.set_defaults(func=cmd_research)
    
    # Discover command
    discover_parser = subparsers.add_parser('discover', help='Discover subreddits')
    discover_parser.add_argument('niche', type=str, help='Niche to search')
    discover_parser.add_argument('--limit', type=int, default=20, help='Max subreddits')
    discover_parser.set_defaults(func=cmd_discover)
    
    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze a subreddit')
    analyze_parser.add_argument('subreddit', type=str, help='Subreddit name')
    analyze_parser.add_argument('--posts', type=int, default=50, help='Posts to analyze')
    analyze_parser.set_defaults(func=cmd_analyze)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    # Check for API key
    from dotenv import load_dotenv
    load_dotenv()
    
    if not os.getenv('RAPIDAPI_KEY'):
        console.print("[red]Error: RAPIDAPI_KEY not found.[/red]")
        console.print("Please set your API key in .env file:")
        console.print("  RAPIDAPI_KEY=your_key_here")
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
