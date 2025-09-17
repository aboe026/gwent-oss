/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "fragment Unit on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ...UnitEffect\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}": typeof types.UnitFragmentDoc,
    "fragment Deck on Deck {\n  id\n  created\n  name\n  faction {\n    ...Faction\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}": typeof types.DeckFragmentDoc,
    "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}": typeof types.DeckStatsFragmentDoc,
    "fragment DeckUnit on DeckUnit {\n  artStyle\n  unit {\n    ...Unit\n  }\n}": typeof types.DeckUnitFragmentDoc,
    "fragment Faction on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}": typeof types.FactionFragmentDoc,
    "fragment Game on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayer\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}": typeof types.GameFragmentDoc,
    "fragment GameDeck on GameDeck {\n  discard {\n    ...DeckUnit\n  }\n  from {\n    created\n    faction {\n      ...GameFaction\n    }\n    id\n    leader {\n      ...GameLeader\n    }\n    name\n  }\n  hand {\n    ...DeckUnit\n  }\n  redraws {\n    from {\n      ...DeckUnit\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n  undrawn {\n    ...DeckUnit\n  }\n}": typeof types.GameDeckFragmentDoc,
    "fragment GameFaction on Faction {\n  ability\n  id\n  image\n  key\n  name\n}": typeof types.GameFactionFragmentDoc,
    "fragment GameLeader on Leader {\n  ability\n  image\n  name\n}": typeof types.GameLeaderFragmentDoc,
    "fragment GamePlayer on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFaction\n  }\n  leader {\n    ...GameLeader\n  }\n  ready\n  rounds {\n    ...PlayerRound\n  }\n  user {\n    id\n    name\n  }\n}": typeof types.GamePlayerFragmentDoc,
    "fragment GameUnit on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    ...GameUnitEffect\n  }\n  row\n  unit {\n    ...Unit\n  }\n}": typeof types.GameUnitFragmentDoc,
    "fragment GameUnitEffect on GameUnitEffect {\n  operator\n  total\n  reason {\n    ... on EffectFromUnit {\n      effect {\n        id\n        name\n      }\n      unit {\n        id\n        name\n      }\n    }\n    ... on EffectFromLeader {\n      leader {\n        id\n        name\n      }\n    }\n  }\n}": typeof types.GameUnitEffectFragmentDoc,
    "fragment Impact on Impact {\n  unit {\n    ...GameUnit\n  }\n  user {\n    id\n    name\n  }\n  source {\n    origin\n  }\n}": typeof types.ImpactFragmentDoc,
    "fragment Move on Move {\n  ... on MoveLeader {\n    ...MoveLeader\n  }\n  ... on MovePass {\n    created\n  }\n  ... on MoveUnit {\n    ...MoveUnit\n  }\n}": typeof types.MoveFragmentDoc,
    "fragment MoveLeader on MoveLeader {\n  created\n  leader {\n    image\n    name\n  }\n}": typeof types.MoveLeaderFragmentDoc,
    "fragment MoveUnit on MoveUnit {\n  created\n  unit {\n    ...GameUnit\n  }\n  impacts {\n    ...Impact\n  }\n  reason {\n    type\n    unit {\n      unit {\n        name\n      }\n    }\n  }\n  source {\n    origin\n  }\n}": typeof types.MoveUnitFragmentDoc,
    "fragment PlayerCombatRow on PlayerCombatRow {\n  score\n  units {\n    ...GameUnit\n  }\n}": typeof types.PlayerCombatRowFragmentDoc,
    "fragment PlayerRound on PlayerRound {\n  close {\n    ...PlayerCombatRow\n  }\n  moves {\n    ...Move\n  }\n  passed\n  ranged {\n    ...PlayerCombatRow\n  }\n  result\n  score\n  siege {\n    ...PlayerCombatRow\n  }\n}": typeof types.PlayerRoundFragmentDoc,
    "fragment UnitEffect on Effect {\n  ability\n  image\n  key\n  name\n}": typeof types.UnitEffectFragmentDoc,
    "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...Deck\n  }\n}": typeof types.AddDeckDocument,
    "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...Game\n  }\n}": typeof types.AddGameDocument,
    "mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}": typeof types.AddUserDocument,
    "mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}": typeof types.LoginDocument,
    "mutation Logout {\n  logout\n}": typeof types.LogoutDocument,
    "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...Game\n  }\n}": typeof types.PlayPassDocument,
    "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...Game\n  }\n}": typeof types.PlayUnitDocument,
    "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...Game\n  }\n}": typeof types.ReadyDocument,
    "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnit\n  }\n}": typeof types.RedrawDocument,
    "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeck\n  }\n}": typeof types.SetDeckDocument,
    "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...Game\n  }\n}": typeof types.SetOrderDocument,
    "query Application {\n  application {\n    build\n    version\n  }\n}": typeof types.ApplicationDocument,
    "query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}": typeof types.CurrentUserDocument,
    "query Decks {\n  decks {\n    ...Deck\n  }\n}": typeof types.DecksDocument,
    "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}": typeof types.FactionStatsDocument,
    "query Factions {\n  factions {\n    ...Faction\n  }\n}": typeof types.FactionsDocument,
    "query Game($id: ID!) {\n  game(id: $id) {\n    ...Game\n  }\n}": typeof types.GameDocument,
    "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeck\n  }\n}": typeof types.GameDeckDocument,
    "query Games {\n  games {\n    ...Game\n  }\n}": typeof types.GamesDocument,
    "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}": typeof types.LeadersDocument,
    "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...Unit\n  }\n}": typeof types.UnitsDocument,
    "subscription DeckAdded {\n  deckAdded {\n    ...Deck\n  }\n}": typeof types.DeckAddedDocument,
    "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeck\n    }\n    game {\n      id\n    }\n  }\n}": typeof types.DeckSetDocument,
    "subscription GameAdded {\n  gameAdded {\n    ...Game\n  }\n}": typeof types.GameAddedDocument,
    "subscription GameReady {\n  gameReady {\n    ...Game\n  }\n}": typeof types.GameReadyDocument,
    "subscription GameSet {\n  gameSet {\n    ...Game\n  }\n}": typeof types.GameSetDocument,
    "subscription OrderSet {\n  orderSet {\n    ...Game\n  }\n}": typeof types.OrderSetDocument,
    "subscription PassPlayed {\n  passPlayed {\n    ...Game\n  }\n}": typeof types.PassPlayedDocument,
    "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeck\n    }\n  }\n}": typeof types.RoundEndedForDeckDocument,
    "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnit\n    }\n  }\n}": typeof types.UnitPlayedFromDeckDocument,
    "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...Game\n    }\n  }\n}": typeof types.UnitPlayedOnGameDocument,
    "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnit\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n}": typeof types.UnitRedrawnDocument,
};
const documents: Documents = {
    "fragment Unit on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ...UnitEffect\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}": types.UnitFragmentDoc,
    "fragment Deck on Deck {\n  id\n  created\n  name\n  faction {\n    ...Faction\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}": types.DeckFragmentDoc,
    "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}": types.DeckStatsFragmentDoc,
    "fragment DeckUnit on DeckUnit {\n  artStyle\n  unit {\n    ...Unit\n  }\n}": types.DeckUnitFragmentDoc,
    "fragment Faction on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}": types.FactionFragmentDoc,
    "fragment Game on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayer\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}": types.GameFragmentDoc,
    "fragment GameDeck on GameDeck {\n  discard {\n    ...DeckUnit\n  }\n  from {\n    created\n    faction {\n      ...GameFaction\n    }\n    id\n    leader {\n      ...GameLeader\n    }\n    name\n  }\n  hand {\n    ...DeckUnit\n  }\n  redraws {\n    from {\n      ...DeckUnit\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n  undrawn {\n    ...DeckUnit\n  }\n}": types.GameDeckFragmentDoc,
    "fragment GameFaction on Faction {\n  ability\n  id\n  image\n  key\n  name\n}": types.GameFactionFragmentDoc,
    "fragment GameLeader on Leader {\n  ability\n  image\n  name\n}": types.GameLeaderFragmentDoc,
    "fragment GamePlayer on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFaction\n  }\n  leader {\n    ...GameLeader\n  }\n  ready\n  rounds {\n    ...PlayerRound\n  }\n  user {\n    id\n    name\n  }\n}": types.GamePlayerFragmentDoc,
    "fragment GameUnit on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    ...GameUnitEffect\n  }\n  row\n  unit {\n    ...Unit\n  }\n}": types.GameUnitFragmentDoc,
    "fragment GameUnitEffect on GameUnitEffect {\n  operator\n  total\n  reason {\n    ... on EffectFromUnit {\n      effect {\n        id\n        name\n      }\n      unit {\n        id\n        name\n      }\n    }\n    ... on EffectFromLeader {\n      leader {\n        id\n        name\n      }\n    }\n  }\n}": types.GameUnitEffectFragmentDoc,
    "fragment Impact on Impact {\n  unit {\n    ...GameUnit\n  }\n  user {\n    id\n    name\n  }\n  source {\n    origin\n  }\n}": types.ImpactFragmentDoc,
    "fragment Move on Move {\n  ... on MoveLeader {\n    ...MoveLeader\n  }\n  ... on MovePass {\n    created\n  }\n  ... on MoveUnit {\n    ...MoveUnit\n  }\n}": types.MoveFragmentDoc,
    "fragment MoveLeader on MoveLeader {\n  created\n  leader {\n    image\n    name\n  }\n}": types.MoveLeaderFragmentDoc,
    "fragment MoveUnit on MoveUnit {\n  created\n  unit {\n    ...GameUnit\n  }\n  impacts {\n    ...Impact\n  }\n  reason {\n    type\n    unit {\n      unit {\n        name\n      }\n    }\n  }\n  source {\n    origin\n  }\n}": types.MoveUnitFragmentDoc,
    "fragment PlayerCombatRow on PlayerCombatRow {\n  score\n  units {\n    ...GameUnit\n  }\n}": types.PlayerCombatRowFragmentDoc,
    "fragment PlayerRound on PlayerRound {\n  close {\n    ...PlayerCombatRow\n  }\n  moves {\n    ...Move\n  }\n  passed\n  ranged {\n    ...PlayerCombatRow\n  }\n  result\n  score\n  siege {\n    ...PlayerCombatRow\n  }\n}": types.PlayerRoundFragmentDoc,
    "fragment UnitEffect on Effect {\n  ability\n  image\n  key\n  name\n}": types.UnitEffectFragmentDoc,
    "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...Deck\n  }\n}": types.AddDeckDocument,
    "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...Game\n  }\n}": types.AddGameDocument,
    "mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}": types.AddUserDocument,
    "mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}": types.LoginDocument,
    "mutation Logout {\n  logout\n}": types.LogoutDocument,
    "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...Game\n  }\n}": types.PlayPassDocument,
    "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...Game\n  }\n}": types.PlayUnitDocument,
    "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...Game\n  }\n}": types.ReadyDocument,
    "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnit\n  }\n}": types.RedrawDocument,
    "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeck\n  }\n}": types.SetDeckDocument,
    "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...Game\n  }\n}": types.SetOrderDocument,
    "query Application {\n  application {\n    build\n    version\n  }\n}": types.ApplicationDocument,
    "query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}": types.CurrentUserDocument,
    "query Decks {\n  decks {\n    ...Deck\n  }\n}": types.DecksDocument,
    "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}": types.FactionStatsDocument,
    "query Factions {\n  factions {\n    ...Faction\n  }\n}": types.FactionsDocument,
    "query Game($id: ID!) {\n  game(id: $id) {\n    ...Game\n  }\n}": types.GameDocument,
    "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeck\n  }\n}": types.GameDeckDocument,
    "query Games {\n  games {\n    ...Game\n  }\n}": types.GamesDocument,
    "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}": types.LeadersDocument,
    "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...Unit\n  }\n}": types.UnitsDocument,
    "subscription DeckAdded {\n  deckAdded {\n    ...Deck\n  }\n}": types.DeckAddedDocument,
    "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeck\n    }\n    game {\n      id\n    }\n  }\n}": types.DeckSetDocument,
    "subscription GameAdded {\n  gameAdded {\n    ...Game\n  }\n}": types.GameAddedDocument,
    "subscription GameReady {\n  gameReady {\n    ...Game\n  }\n}": types.GameReadyDocument,
    "subscription GameSet {\n  gameSet {\n    ...Game\n  }\n}": types.GameSetDocument,
    "subscription OrderSet {\n  orderSet {\n    ...Game\n  }\n}": types.OrderSetDocument,
    "subscription PassPlayed {\n  passPlayed {\n    ...Game\n  }\n}": types.PassPlayedDocument,
    "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeck\n    }\n  }\n}": types.RoundEndedForDeckDocument,
    "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnit\n    }\n  }\n}": types.UnitPlayedFromDeckDocument,
    "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...Game\n    }\n  }\n}": types.UnitPlayedOnGameDocument,
    "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnit\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n}": types.UnitRedrawnDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Unit on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ...UnitEffect\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}"): (typeof documents)["fragment Unit on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ...UnitEffect\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Deck on Deck {\n  id\n  created\n  name\n  faction {\n    ...Faction\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}"): (typeof documents)["fragment Deck on Deck {\n  id\n  created\n  name\n  faction {\n    ...Faction\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}"): (typeof documents)["fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment DeckUnit on DeckUnit {\n  artStyle\n  unit {\n    ...Unit\n  }\n}"): (typeof documents)["fragment DeckUnit on DeckUnit {\n  artStyle\n  unit {\n    ...Unit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Faction on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}"): (typeof documents)["fragment Faction on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Game on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayer\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}"): (typeof documents)["fragment Game on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayer\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameDeck on GameDeck {\n  discard {\n    ...DeckUnit\n  }\n  from {\n    created\n    faction {\n      ...GameFaction\n    }\n    id\n    leader {\n      ...GameLeader\n    }\n    name\n  }\n  hand {\n    ...DeckUnit\n  }\n  redraws {\n    from {\n      ...DeckUnit\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n  undrawn {\n    ...DeckUnit\n  }\n}"): (typeof documents)["fragment GameDeck on GameDeck {\n  discard {\n    ...DeckUnit\n  }\n  from {\n    created\n    faction {\n      ...GameFaction\n    }\n    id\n    leader {\n      ...GameLeader\n    }\n    name\n  }\n  hand {\n    ...DeckUnit\n  }\n  redraws {\n    from {\n      ...DeckUnit\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n  undrawn {\n    ...DeckUnit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameFaction on Faction {\n  ability\n  id\n  image\n  key\n  name\n}"): (typeof documents)["fragment GameFaction on Faction {\n  ability\n  id\n  image\n  key\n  name\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameLeader on Leader {\n  ability\n  image\n  name\n}"): (typeof documents)["fragment GameLeader on Leader {\n  ability\n  image\n  name\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GamePlayer on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFaction\n  }\n  leader {\n    ...GameLeader\n  }\n  ready\n  rounds {\n    ...PlayerRound\n  }\n  user {\n    id\n    name\n  }\n}"): (typeof documents)["fragment GamePlayer on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFaction\n  }\n  leader {\n    ...GameLeader\n  }\n  ready\n  rounds {\n    ...PlayerRound\n  }\n  user {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameUnit on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    ...GameUnitEffect\n  }\n  row\n  unit {\n    ...Unit\n  }\n}"): (typeof documents)["fragment GameUnit on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    ...GameUnitEffect\n  }\n  row\n  unit {\n    ...Unit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameUnitEffect on GameUnitEffect {\n  operator\n  total\n  reason {\n    ... on EffectFromUnit {\n      effect {\n        id\n        name\n      }\n      unit {\n        id\n        name\n      }\n    }\n    ... on EffectFromLeader {\n      leader {\n        id\n        name\n      }\n    }\n  }\n}"): (typeof documents)["fragment GameUnitEffect on GameUnitEffect {\n  operator\n  total\n  reason {\n    ... on EffectFromUnit {\n      effect {\n        id\n        name\n      }\n      unit {\n        id\n        name\n      }\n    }\n    ... on EffectFromLeader {\n      leader {\n        id\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Impact on Impact {\n  unit {\n    ...GameUnit\n  }\n  user {\n    id\n    name\n  }\n  source {\n    origin\n  }\n}"): (typeof documents)["fragment Impact on Impact {\n  unit {\n    ...GameUnit\n  }\n  user {\n    id\n    name\n  }\n  source {\n    origin\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment Move on Move {\n  ... on MoveLeader {\n    ...MoveLeader\n  }\n  ... on MovePass {\n    created\n  }\n  ... on MoveUnit {\n    ...MoveUnit\n  }\n}"): (typeof documents)["fragment Move on Move {\n  ... on MoveLeader {\n    ...MoveLeader\n  }\n  ... on MovePass {\n    created\n  }\n  ... on MoveUnit {\n    ...MoveUnit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment MoveLeader on MoveLeader {\n  created\n  leader {\n    image\n    name\n  }\n}"): (typeof documents)["fragment MoveLeader on MoveLeader {\n  created\n  leader {\n    image\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment MoveUnit on MoveUnit {\n  created\n  unit {\n    ...GameUnit\n  }\n  impacts {\n    ...Impact\n  }\n  reason {\n    type\n    unit {\n      unit {\n        name\n      }\n    }\n  }\n  source {\n    origin\n  }\n}"): (typeof documents)["fragment MoveUnit on MoveUnit {\n  created\n  unit {\n    ...GameUnit\n  }\n  impacts {\n    ...Impact\n  }\n  reason {\n    type\n    unit {\n      unit {\n        name\n      }\n    }\n  }\n  source {\n    origin\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment PlayerCombatRow on PlayerCombatRow {\n  score\n  units {\n    ...GameUnit\n  }\n}"): (typeof documents)["fragment PlayerCombatRow on PlayerCombatRow {\n  score\n  units {\n    ...GameUnit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment PlayerRound on PlayerRound {\n  close {\n    ...PlayerCombatRow\n  }\n  moves {\n    ...Move\n  }\n  passed\n  ranged {\n    ...PlayerCombatRow\n  }\n  result\n  score\n  siege {\n    ...PlayerCombatRow\n  }\n}"): (typeof documents)["fragment PlayerRound on PlayerRound {\n  close {\n    ...PlayerCombatRow\n  }\n  moves {\n    ...Move\n  }\n  passed\n  ranged {\n    ...PlayerCombatRow\n  }\n  result\n  score\n  siege {\n    ...PlayerCombatRow\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment UnitEffect on Effect {\n  ability\n  image\n  key\n  name\n}"): (typeof documents)["fragment UnitEffect on Effect {\n  ability\n  image\n  key\n  name\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...Deck\n  }\n}"): (typeof documents)["mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...Deck\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...Game\n  }\n}"): (typeof documents)["mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}"): (typeof documents)["mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}"): (typeof documents)["mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Logout {\n  logout\n}"): (typeof documents)["mutation Logout {\n  logout\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...Game\n  }\n}"): (typeof documents)["mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...Game\n  }\n}"): (typeof documents)["mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...Game\n  }\n}"): (typeof documents)["mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnit\n  }\n}"): (typeof documents)["mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeck\n  }\n}"): (typeof documents)["mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeck\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...Game\n  }\n}"): (typeof documents)["mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Application {\n  application {\n    build\n    version\n  }\n}"): (typeof documents)["query Application {\n  application {\n    build\n    version\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}"): (typeof documents)["query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Decks {\n  decks {\n    ...Deck\n  }\n}"): (typeof documents)["query Decks {\n  decks {\n    ...Deck\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}"): (typeof documents)["query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Factions {\n  factions {\n    ...Faction\n  }\n}"): (typeof documents)["query Factions {\n  factions {\n    ...Faction\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Game($id: ID!) {\n  game(id: $id) {\n    ...Game\n  }\n}"): (typeof documents)["query Game($id: ID!) {\n  game(id: $id) {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeck\n  }\n}"): (typeof documents)["query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeck\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Games {\n  games {\n    ...Game\n  }\n}"): (typeof documents)["query Games {\n  games {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}"): (typeof documents)["query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...Unit\n  }\n}"): (typeof documents)["query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...Unit\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription DeckAdded {\n  deckAdded {\n    ...Deck\n  }\n}"): (typeof documents)["subscription DeckAdded {\n  deckAdded {\n    ...Deck\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeck\n    }\n    game {\n      id\n    }\n  }\n}"): (typeof documents)["subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeck\n    }\n    game {\n      id\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameAdded {\n  gameAdded {\n    ...Game\n  }\n}"): (typeof documents)["subscription GameAdded {\n  gameAdded {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameReady {\n  gameReady {\n    ...Game\n  }\n}"): (typeof documents)["subscription GameReady {\n  gameReady {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameSet {\n  gameSet {\n    ...Game\n  }\n}"): (typeof documents)["subscription GameSet {\n  gameSet {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription OrderSet {\n  orderSet {\n    ...Game\n  }\n}"): (typeof documents)["subscription OrderSet {\n  orderSet {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription PassPlayed {\n  passPlayed {\n    ...Game\n  }\n}"): (typeof documents)["subscription PassPlayed {\n  passPlayed {\n    ...Game\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeck\n    }\n  }\n}"): (typeof documents)["subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeck\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnit\n    }\n  }\n}"): (typeof documents)["subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnit\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...Game\n    }\n  }\n}"): (typeof documents)["subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...Game\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnit\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n}"): (typeof documents)["subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnit\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnit\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;