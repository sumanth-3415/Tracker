/**
 * TrackMate - SPA Hash Router & Navigation State (With Scroll Preservation)
 */

class TrackMateRouter {
  constructor() {
    this.currentPath = null;
    this.routes = {
      '': DashboardView,
      '#dashboard': DashboardView,
      '#trackers': TrackersView,
      '#tasks': TasksView,
      '#habits': HabitsView,
      '#calendar': CalendarView,
      '#goals': GoalsView,
      '#analytics': AnalyticsView,
      '#reports': ReportsView,
      '#settings': SettingsView
    };

    window.addEventListener('hashchange', () => this.handleRoute(true));
  }

  async handleRoute(isExplicitNavigation = false) {
    const rawHash = window.location.hash || '#dashboard';
    const [path, queryString] = rawHash.split('?');
    const container = document.getElementById('view-content');
    if (!container) return;

    const isNewPage = this.currentPath !== path;
    this.currentPath = path;

    // Preserve scroll position on in-page state updates
    const savedScrollY = window.scrollY;

    // Check for shared tracker route `#shared/:id`
    if (path.startsWith('#shared/')) {
      const trackerId = path.replace('#shared/', '');
      const params = new URLSearchParams(queryString || '');
      const token = params.get('token');
      await SharedView.render(container, trackerId, token);
      this.updateActiveNavLinks(path);
      return;
    }

    const ViewClass = this.routes[path] || DashboardView;

    // Render View
    await ViewClass.render(container);

    // Scroll handling: Only jump to top on actual navigation to a different tab/page!
    if (isNewPage && isExplicitNavigation) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      // Stay at current scroll position on in-page updates/deletions
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    }

    // Close mobile sidebar if open
    if (window.app && window.app.closeSidebar) {
      window.app.closeSidebar();
    }

    // Update active nav indicators in sidebar and mobile bottom nav
    this.updateActiveNavLinks(path);
  }

  updateActiveNavLinks(activePath) {
    const base = activePath === '' ? '#dashboard' : activePath;

    // Desktop Sidebar links
    document.querySelectorAll('.app-sidebar .nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === base) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile Bottom Nav items
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach((item) => {
      const href = item.getAttribute('href');
      if (href === base) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

window.router = new TrackMateRouter();
