export interface NflTeam {
  abbr: string
  name: string
  color: string // color primario de franquicia (placeholder de logo)
}

export const NFL_TEAMS: NflTeam[] = [
  { abbr: 'ARI', name: 'Arizona Cardinals', color: '#97233F' },
  { abbr: 'ATL', name: 'Atlanta Falcons', color: '#A71930' },
  { abbr: 'BAL', name: 'Baltimore Ravens', color: '#241773' },
  { abbr: 'BUF', name: 'Buffalo Bills', color: '#00338D' },
  { abbr: 'CAR', name: 'Carolina Panthers', color: '#0085CA' },
  { abbr: 'CHI', name: 'Chicago Bears', color: '#C83803' },
  { abbr: 'CIN', name: 'Cincinnati Bengals', color: '#FB4F14' },
  { abbr: 'CLE', name: 'Cleveland Browns', color: '#FF3C00' },
  { abbr: 'DAL', name: 'Dallas Cowboys', color: '#003594' },
  { abbr: 'DEN', name: 'Denver Broncos', color: '#FB4F14' },
  { abbr: 'DET', name: 'Detroit Lions', color: '#0076B6' },
  { abbr: 'GB', name: 'Green Bay Packers', color: '#203731' },
  { abbr: 'HOU', name: 'Houston Texans', color: '#03202F' },
  { abbr: 'IND', name: 'Indianapolis Colts', color: '#002C5F' },
  { abbr: 'JAX', name: 'Jacksonville Jaguars', color: '#006778' },
  { abbr: 'KC', name: 'Kansas City Chiefs', color: '#E31837' },
  { abbr: 'LAC', name: 'Los Angeles Chargers', color: '#0080C6' },
  { abbr: 'LAR', name: 'Los Angeles Rams', color: '#003594' },
  { abbr: 'LV', name: 'Las Vegas Raiders', color: '#A5ACAF' },
  { abbr: 'MIA', name: 'Miami Dolphins', color: '#008E97' },
  { abbr: 'MIN', name: 'Minnesota Vikings', color: '#4F2683' },
  { abbr: 'NE', name: 'New England Patriots', color: '#002244' },
  { abbr: 'NO', name: 'New Orleans Saints', color: '#D3BC8D' },
  { abbr: 'NYG', name: 'New York Giants', color: '#0B2265' },
  { abbr: 'NYJ', name: 'New York Jets', color: '#125740' },
  { abbr: 'PHI', name: 'Philadelphia Eagles', color: '#004C54' },
  { abbr: 'PIT', name: 'Pittsburgh Steelers', color: '#FFB612' },
  { abbr: 'SEA', name: 'Seattle Seahawks', color: '#002244' },
  { abbr: 'SF', name: 'San Francisco 49ers', color: '#AA0000' },
  { abbr: 'TB', name: 'Tampa Bay Buccaneers', color: '#D50A0A' },
  { abbr: 'TEN', name: 'Tennessee Titans', color: '#4B92DB' },
  { abbr: 'WAS', name: 'Washington Commanders', color: '#5A1414' },
]

export const teamByAbbr = (abbr: string): NflTeam | undefined =>
  NFL_TEAMS.find((t) => t.abbr === abbr)
