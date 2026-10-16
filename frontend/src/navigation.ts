export type AppRoute =
  | 'overview'
  | 'price-intelligence'
  | 'supply-capacity'
  | 'demand-intelligence'
  | 'trade-intelligence'
  | 'business-trade'
  | 'production-operations'
  | 'plant-outages'
  | 'competitor-intelligence'
  | 'quarterly-report'
  | 'forecasts-scenarios'
  | 'news-developments'
  | 'ask-intelligence'
  | 'data-coverage'
  // Backward-compatible alias types
  | 'market-intelligence'
  | 'news-competitors';

export interface RouteState {
  route: AppRoute;
  subTab?: string;
}

export function parseHash(hash: string): RouteState {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { route: 'overview' };

  const [pathPart, queryPart] = clean.split('?');
  const params = new URLSearchParams(queryPart || '');
  const subTab = params.get('tab') || undefined;

  switch (pathPart) {
    case 'overview':
      return { route: 'overview', subTab };
    case 'price-intelligence':
    case 'market-intelligence':
    case 'pricing':
      return { route: 'price-intelligence', subTab };
    case 'supply-capacity':
    case 'supply':
      return { route: 'supply-capacity', subTab };
    case 'demand-intelligence':
    case 'demand':
      return { route: 'demand-intelligence', subTab };
    case 'trade-intelligence':
    case 'business-trade':
    case 'trade':
      return { route: 'business-trade', subTab };
    case 'production-operations':
    case 'production':
    case 'operations':
      return { route: 'production-operations', subTab };
    case 'plant-outages':
    case 'outages':
    case 'disruptions':
      return { route: 'plant-outages', subTab };
    case 'competitor-intelligence':
    case 'competitors':
      return { route: 'competitor-intelligence', subTab };
    case 'quarterly-report':
    case 'quarterly':
    case 'reports':
      return { route: 'quarterly-report', subTab };
    case 'forecasts-scenarios':
    case 'forecasts':
    case 'scenarios':
      return { route: 'forecasts-scenarios', subTab };
    case 'news-developments':
    case 'news-competitors':
    case 'news':
      return { route: 'news-developments', subTab };
    case 'ask-intelligence':
    case 'chat':
      return { route: 'ask-intelligence', subTab };
    case 'data-coverage':
    case 'datasources':
      return { route: 'data-coverage', subTab };
    default:
      return { route: 'overview' };
  }
}

export function formatHash(route: AppRoute, subTab?: string): string {
  if (route === 'overview') return '#/overview';
  const query = subTab ? `?tab=${encodeURIComponent(subTab)}` : '';
  return `#/${route}${query}`;
}

export function navigateTo(route: AppRoute, subTab?: string) {
  const hash = formatHash(route, subTab);
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}
