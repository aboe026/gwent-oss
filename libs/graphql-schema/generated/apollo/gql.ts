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
    "fragment CardUnitFragment on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ability\n    image\n    key\n    name\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}": typeof types.CardUnitFragmentFragmentDoc,
    "fragment DeckFragment on Deck {\n  id\n  created\n  name\n  faction {\n    ...FactionFragment\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}": typeof types.DeckFragmentFragmentDoc,
    "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}": typeof types.DeckStatsFragmentDoc,
    "fragment DeckUnitFragment on DeckUnit {\n  artStyle\n  unit {\n    ...CardUnitFragment\n  }\n}": typeof types.DeckUnitFragmentFragmentDoc,
    "fragment FactionFragment on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}": typeof types.FactionFragmentFragmentDoc,
    "fragment GameDeckFragment on GameDeck {\n  discard {\n    ...DeckUnitFragment\n  }\n  from {\n    created\n    faction {\n      ...GameFactionFragment\n    }\n    id\n    leader {\n      ...GameLeaderFragment\n    }\n    name\n  }\n  hand {\n    ...DeckUnitFragment\n  }\n  redraws {\n    from {\n      ...DeckUnitFragment\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n  undrawn {\n    ...DeckUnitFragment\n  }\n}": typeof types.GameDeckFragmentFragmentDoc,
    "fragment GameFactionFragment on Faction {\n  ability\n  id\n  image\n  key\n  name\n}": typeof types.GameFactionFragmentFragmentDoc,
    "fragment GameFragment on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayerFragment\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}": typeof types.GameFragmentFragmentDoc,
    "fragment GameLeaderFragment on Leader {\n  ability\n  image\n  name\n}": typeof types.GameLeaderFragmentFragmentDoc,
    "fragment GamePlayerFragment on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFactionFragment\n  }\n  leader {\n    ...GameLeaderFragment\n  }\n  ready\n  rounds {\n    close {\n      ...PlayerCombatRowFragment\n    }\n    moves {\n      ... on MoveLeader {\n        created\n        leader {\n          image\n          name\n        }\n      }\n      ... on MovePass {\n        created\n      }\n      ... on MoveUnit {\n        created\n        unit {\n          ...GameUnitFragment\n        }\n        impacts {\n          unit {\n            ...GameUnitFragment\n          }\n          user {\n            id\n            name\n          }\n          source {\n            origin\n          }\n        }\n        reason {\n          type\n          unit {\n            unit {\n              name\n            }\n          }\n        }\n        source {\n          origin\n        }\n      }\n    }\n    passed\n    ranged {\n      ...PlayerCombatRowFragment\n    }\n    result\n    score\n    siege {\n      ...PlayerCombatRowFragment\n    }\n  }\n  user {\n    id\n    name\n  }\n}": typeof types.GamePlayerFragmentFragmentDoc,
    "fragment GameUnitFragment on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    operator\n    total\n    reason {\n      ... on EffectFromUnit {\n        effect {\n          id\n          name\n        }\n        unit {\n          id\n          name\n        }\n      }\n      ... on EffectFromLeader {\n        leader {\n          id\n          name\n        }\n      }\n    }\n  }\n  row\n  unit {\n    ...CardUnitFragment\n  }\n}": typeof types.GameUnitFragmentFragmentDoc,
    "fragment PlayerCombatRowFragment on PlayerCombatRow {\n  score\n  units {\n    ...GameUnitFragment\n  }\n}": typeof types.PlayerCombatRowFragmentFragmentDoc,
    "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...DeckFragment\n  }\n}": typeof types.AddDeckDocument,
    "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...GameFragment\n  }\n}": typeof types.AddGameDocument,
    "mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}": typeof types.AddUserDocument,
    "mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}": typeof types.LoginDocument,
    "mutation Logout {\n  logout\n}": typeof types.LogoutDocument,
    "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...GameFragment\n  }\n}": typeof types.PlayPassDocument,
    "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...GameFragment\n  }\n}": typeof types.PlayUnitDocument,
    "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...GameFragment\n  }\n}": typeof types.ReadyDocument,
    "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnitFragment\n  }\n}": typeof types.RedrawDocument,
    "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeckFragment\n  }\n}": typeof types.SetDeckDocument,
    "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...GameFragment\n  }\n}": typeof types.SetOrderDocument,
    "query Application {\n  application {\n    build\n    version\n  }\n}": typeof types.ApplicationDocument,
    "query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}": typeof types.CurrentUserDocument,
    "query Decks {\n  decks {\n    ...DeckFragment\n  }\n}": typeof types.DecksDocument,
    "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}": typeof types.FactionStatsDocument,
    "query Factions {\n  factions {\n    ...FactionFragment\n  }\n}": typeof types.FactionsDocument,
    "query Game($id: ID!) {\n  game(id: $id) {\n    ...GameFragment\n  }\n}": typeof types.GameDocument,
    "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeckFragment\n  }\n}": typeof types.GameDeckDocument,
    "query Games {\n  games {\n    ...GameFragment\n  }\n}": typeof types.GamesDocument,
    "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}": typeof types.LeadersDocument,
    "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...CardUnitFragment\n  }\n}": typeof types.UnitsDocument,
    "subscription DeckAdded {\n  deckAdded {\n    ...DeckFragment\n  }\n}": typeof types.DeckAddedDocument,
    "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeckFragment\n    }\n    game {\n      id\n    }\n  }\n}": typeof types.DeckSetDocument,
    "subscription GameAdded {\n  gameAdded {\n    ...GameFragment\n  }\n}": typeof types.GameAddedDocument,
    "subscription GameReady {\n  gameReady {\n    ...GameFragment\n  }\n}": typeof types.GameReadyDocument,
    "subscription GameSet {\n  gameSet {\n    ...GameFragment\n  }\n}": typeof types.GameSetDocument,
    "subscription OrderSet {\n  orderSet {\n    ...GameFragment\n  }\n}": typeof types.OrderSetDocument,
    "subscription PassPlayed {\n  passPlayed {\n    ...GameFragment\n  }\n}": typeof types.PassPlayedDocument,
    "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeckFragment\n    }\n  }\n}": typeof types.RoundEndedForDeckDocument,
    "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnitFragment\n    }\n  }\n}": typeof types.UnitPlayedFromDeckDocument,
    "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...GameFragment\n    }\n  }\n}": typeof types.UnitPlayedOnGameDocument,
    "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnitFragment\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n}": typeof types.UnitRedrawnDocument,
};
const documents: Documents = {
    "fragment CardUnitFragment on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ability\n    image\n    key\n    name\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}": types.CardUnitFragmentFragmentDoc,
    "fragment DeckFragment on Deck {\n  id\n  created\n  name\n  faction {\n    ...FactionFragment\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}": types.DeckFragmentFragmentDoc,
    "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}": types.DeckStatsFragmentDoc,
    "fragment DeckUnitFragment on DeckUnit {\n  artStyle\n  unit {\n    ...CardUnitFragment\n  }\n}": types.DeckUnitFragmentFragmentDoc,
    "fragment FactionFragment on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}": types.FactionFragmentFragmentDoc,
    "fragment GameDeckFragment on GameDeck {\n  discard {\n    ...DeckUnitFragment\n  }\n  from {\n    created\n    faction {\n      ...GameFactionFragment\n    }\n    id\n    leader {\n      ...GameLeaderFragment\n    }\n    name\n  }\n  hand {\n    ...DeckUnitFragment\n  }\n  redraws {\n    from {\n      ...DeckUnitFragment\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n  undrawn {\n    ...DeckUnitFragment\n  }\n}": types.GameDeckFragmentFragmentDoc,
    "fragment GameFactionFragment on Faction {\n  ability\n  id\n  image\n  key\n  name\n}": types.GameFactionFragmentFragmentDoc,
    "fragment GameFragment on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayerFragment\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}": types.GameFragmentFragmentDoc,
    "fragment GameLeaderFragment on Leader {\n  ability\n  image\n  name\n}": types.GameLeaderFragmentFragmentDoc,
    "fragment GamePlayerFragment on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFactionFragment\n  }\n  leader {\n    ...GameLeaderFragment\n  }\n  ready\n  rounds {\n    close {\n      ...PlayerCombatRowFragment\n    }\n    moves {\n      ... on MoveLeader {\n        created\n        leader {\n          image\n          name\n        }\n      }\n      ... on MovePass {\n        created\n      }\n      ... on MoveUnit {\n        created\n        unit {\n          ...GameUnitFragment\n        }\n        impacts {\n          unit {\n            ...GameUnitFragment\n          }\n          user {\n            id\n            name\n          }\n          source {\n            origin\n          }\n        }\n        reason {\n          type\n          unit {\n            unit {\n              name\n            }\n          }\n        }\n        source {\n          origin\n        }\n      }\n    }\n    passed\n    ranged {\n      ...PlayerCombatRowFragment\n    }\n    result\n    score\n    siege {\n      ...PlayerCombatRowFragment\n    }\n  }\n  user {\n    id\n    name\n  }\n}": types.GamePlayerFragmentFragmentDoc,
    "fragment GameUnitFragment on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    operator\n    total\n    reason {\n      ... on EffectFromUnit {\n        effect {\n          id\n          name\n        }\n        unit {\n          id\n          name\n        }\n      }\n      ... on EffectFromLeader {\n        leader {\n          id\n          name\n        }\n      }\n    }\n  }\n  row\n  unit {\n    ...CardUnitFragment\n  }\n}": types.GameUnitFragmentFragmentDoc,
    "fragment PlayerCombatRowFragment on PlayerCombatRow {\n  score\n  units {\n    ...GameUnitFragment\n  }\n}": types.PlayerCombatRowFragmentFragmentDoc,
    "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...DeckFragment\n  }\n}": types.AddDeckDocument,
    "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...GameFragment\n  }\n}": types.AddGameDocument,
    "mutation AddUser($name: String!, $password: String!) {\n  addUser(name: $name, password: $password) {\n    id\n    name\n  }\n}": types.AddUserDocument,
    "mutation Login($name: String!, $password: String!) {\n  login(name: $name, password: $password) {\n    id\n    name\n    created\n  }\n}": types.LoginDocument,
    "mutation Logout {\n  logout\n}": types.LogoutDocument,
    "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...GameFragment\n  }\n}": types.PlayPassDocument,
    "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...GameFragment\n  }\n}": types.PlayUnitDocument,
    "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...GameFragment\n  }\n}": types.ReadyDocument,
    "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnitFragment\n  }\n}": types.RedrawDocument,
    "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeckFragment\n  }\n}": types.SetDeckDocument,
    "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...GameFragment\n  }\n}": types.SetOrderDocument,
    "query Application {\n  application {\n    build\n    version\n  }\n}": types.ApplicationDocument,
    "query CurrentUser {\n  currentUser {\n    id\n    name\n    created\n  }\n}": types.CurrentUserDocument,
    "query Decks {\n  decks {\n    ...DeckFragment\n  }\n}": types.DecksDocument,
    "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}": types.FactionStatsDocument,
    "query Factions {\n  factions {\n    ...FactionFragment\n  }\n}": types.FactionsDocument,
    "query Game($id: ID!) {\n  game(id: $id) {\n    ...GameFragment\n  }\n}": types.GameDocument,
    "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeckFragment\n  }\n}": types.GameDeckDocument,
    "query Games {\n  games {\n    ...GameFragment\n  }\n}": types.GamesDocument,
    "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}": types.LeadersDocument,
    "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...CardUnitFragment\n  }\n}": types.UnitsDocument,
    "subscription DeckAdded {\n  deckAdded {\n    ...DeckFragment\n  }\n}": types.DeckAddedDocument,
    "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeckFragment\n    }\n    game {\n      id\n    }\n  }\n}": types.DeckSetDocument,
    "subscription GameAdded {\n  gameAdded {\n    ...GameFragment\n  }\n}": types.GameAddedDocument,
    "subscription GameReady {\n  gameReady {\n    ...GameFragment\n  }\n}": types.GameReadyDocument,
    "subscription GameSet {\n  gameSet {\n    ...GameFragment\n  }\n}": types.GameSetDocument,
    "subscription OrderSet {\n  orderSet {\n    ...GameFragment\n  }\n}": types.OrderSetDocument,
    "subscription PassPlayed {\n  passPlayed {\n    ...GameFragment\n  }\n}": types.PassPlayedDocument,
    "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeckFragment\n    }\n  }\n}": types.RoundEndedForDeckDocument,
    "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnitFragment\n    }\n  }\n}": types.UnitPlayedFromDeckDocument,
    "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...GameFragment\n    }\n  }\n}": types.UnitPlayedOnGameDocument,
    "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnitFragment\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n}": types.UnitRedrawnDocument,
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
export function graphql(source: "fragment CardUnitFragment on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ability\n    image\n    key\n    name\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}"): (typeof documents)["fragment CardUnitFragment on Unit {\n  combats\n  deckable\n  dlc {\n    name\n    image\n    key\n  }\n  effects {\n    ability\n    image\n    key\n    name\n  }\n  faction {\n    image\n    key\n    name\n  }\n  hero\n  id\n  images\n  name\n  quote\n  special\n  strength\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment DeckFragment on Deck {\n  id\n  created\n  name\n  faction {\n    ...FactionFragment\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}"): (typeof documents)["fragment DeckFragment on Deck {\n  id\n  created\n  name\n  faction {\n    ...FactionFragment\n  }\n  leader {\n    name\n    ability\n    image\n  }\n  stats {\n    ...DeckStats\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}"): (typeof documents)["fragment DeckStats on UnitStats {\n  units\n  specials\n  heroes\n  close\n  ranged\n  siege\n  agile\n  strengthTotal\n  strengthAverage\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment DeckUnitFragment on DeckUnit {\n  artStyle\n  unit {\n    ...CardUnitFragment\n  }\n}"): (typeof documents)["fragment DeckUnitFragment on DeckUnit {\n  artStyle\n  unit {\n    ...CardUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment FactionFragment on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}"): (typeof documents)["fragment FactionFragment on Faction {\n  key\n  id\n  name\n  image\n  ability\n  dlc {\n    name\n    image\n  }\n  stats {\n    ...DeckStats\n    avenger\n    berserker\n    bond\n    decoy\n    horn\n    mardroeme\n    medic\n    morale\n    muster\n    scorch\n    spy\n    weather\n    strengths\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameDeckFragment on GameDeck {\n  discard {\n    ...DeckUnitFragment\n  }\n  from {\n    created\n    faction {\n      ...GameFactionFragment\n    }\n    id\n    leader {\n      ...GameLeaderFragment\n    }\n    name\n  }\n  hand {\n    ...DeckUnitFragment\n  }\n  redraws {\n    from {\n      ...DeckUnitFragment\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n  undrawn {\n    ...DeckUnitFragment\n  }\n}"): (typeof documents)["fragment GameDeckFragment on GameDeck {\n  discard {\n    ...DeckUnitFragment\n  }\n  from {\n    created\n    faction {\n      ...GameFactionFragment\n    }\n    id\n    leader {\n      ...GameLeaderFragment\n    }\n    name\n  }\n  hand {\n    ...DeckUnitFragment\n  }\n  redraws {\n    from {\n      ...DeckUnitFragment\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n  undrawn {\n    ...DeckUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameFactionFragment on Faction {\n  ability\n  id\n  image\n  key\n  name\n}"): (typeof documents)["fragment GameFactionFragment on Faction {\n  ability\n  id\n  image\n  key\n  name\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameFragment on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayerFragment\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}"): (typeof documents)["fragment GameFragment on Game {\n  config {\n    lives\n  }\n  created\n  creator {\n    id\n    name\n  }\n  id\n  players {\n    ...GamePlayerFragment\n  }\n  round\n  status\n  turn {\n    user {\n      id\n      name\n    }\n  }\n  updated\n  victors {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameLeaderFragment on Leader {\n  ability\n  image\n  name\n}"): (typeof documents)["fragment GameLeaderFragment on Leader {\n  ability\n  image\n  name\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GamePlayerFragment on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFactionFragment\n  }\n  leader {\n    ...GameLeaderFragment\n  }\n  ready\n  rounds {\n    close {\n      ...PlayerCombatRowFragment\n    }\n    moves {\n      ... on MoveLeader {\n        created\n        leader {\n          image\n          name\n        }\n      }\n      ... on MovePass {\n        created\n      }\n      ... on MoveUnit {\n        created\n        unit {\n          ...GameUnitFragment\n        }\n        impacts {\n          unit {\n            ...GameUnitFragment\n          }\n          user {\n            id\n            name\n          }\n          source {\n            origin\n          }\n        }\n        reason {\n          type\n          unit {\n            unit {\n              name\n            }\n          }\n        }\n        source {\n          origin\n        }\n      }\n    }\n    passed\n    ranged {\n      ...PlayerCombatRowFragment\n    }\n    result\n    score\n    siege {\n      ...PlayerCombatRowFragment\n    }\n  }\n  user {\n    id\n    name\n  }\n}"): (typeof documents)["fragment GamePlayerFragment on GamePlayer {\n  counts {\n    discard\n    hand\n    undrawn\n  }\n  faction {\n    ...GameFactionFragment\n  }\n  leader {\n    ...GameLeaderFragment\n  }\n  ready\n  rounds {\n    close {\n      ...PlayerCombatRowFragment\n    }\n    moves {\n      ... on MoveLeader {\n        created\n        leader {\n          image\n          name\n        }\n      }\n      ... on MovePass {\n        created\n      }\n      ... on MoveUnit {\n        created\n        unit {\n          ...GameUnitFragment\n        }\n        impacts {\n          unit {\n            ...GameUnitFragment\n          }\n          user {\n            id\n            name\n          }\n          source {\n            origin\n          }\n        }\n        reason {\n          type\n          unit {\n            unit {\n              name\n            }\n          }\n        }\n        source {\n          origin\n        }\n      }\n    }\n    passed\n    ranged {\n      ...PlayerCombatRowFragment\n    }\n    result\n    score\n    siege {\n      ...PlayerCombatRowFragment\n    }\n  }\n  user {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment GameUnitFragment on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    operator\n    total\n    reason {\n      ... on EffectFromUnit {\n        effect {\n          id\n          name\n        }\n        unit {\n          id\n          name\n        }\n      }\n      ... on EffectFromLeader {\n        leader {\n          id\n          name\n        }\n      }\n    }\n  }\n  row\n  unit {\n    ...CardUnitFragment\n  }\n}"): (typeof documents)["fragment GameUnitFragment on GameUnit {\n  artStyle\n  effectiveStrength\n  effects {\n    operator\n    total\n    reason {\n      ... on EffectFromUnit {\n        effect {\n          id\n          name\n        }\n        unit {\n          id\n          name\n        }\n      }\n      ... on EffectFromLeader {\n        leader {\n          id\n          name\n        }\n      }\n    }\n  }\n  row\n  unit {\n    ...CardUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment PlayerCombatRowFragment on PlayerCombatRow {\n  score\n  units {\n    ...GameUnitFragment\n  }\n}"): (typeof documents)["fragment PlayerCombatRowFragment on PlayerCombatRow {\n  score\n  units {\n    ...GameUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...DeckFragment\n  }\n}"): (typeof documents)["mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {\n  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {\n    ...DeckFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...GameFragment\n  }\n}"): (typeof documents)["mutation AddGame($opponentNames: [String!]!) {\n  addGame(opponentNames: $opponentNames) {\n    ...GameFragment\n  }\n}"];
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
export function graphql(source: "mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...GameFragment\n  }\n}"): (typeof documents)["mutation PlayPass($game: ID!) {\n  playPass(game: $game) {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...GameFragment\n  }\n}"): (typeof documents)["mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat) {\n  playUnit(game: $game, unit: $unit, combat: $combat) {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...GameFragment\n  }\n}"): (typeof documents)["mutation Ready($game: ID!) {\n  ready(game: $game) {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnitFragment\n  }\n}"): (typeof documents)["mutation Redraw($game: ID!, $unit: ID!) {\n  redraw(game: $game, unit: $unit) {\n    ...DeckUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeckFragment\n  }\n}"): (typeof documents)["mutation SetDeck($game: ID!, $deck: ID!) {\n  setDeck(game: $game, deck: $deck) {\n    ...GameDeckFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...GameFragment\n  }\n}"): (typeof documents)["mutation SetOrder($game: ID!, $users: [ID!]) {\n  setOrder(game: $game, users: $users) {\n    ...GameFragment\n  }\n}"];
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
export function graphql(source: "query Decks {\n  decks {\n    ...DeckFragment\n  }\n}"): (typeof documents)["query Decks {\n  decks {\n    ...DeckFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}"): (typeof documents)["query FactionStats($keys: [FactionKey!]) {\n  factions(keys: $keys) {\n    key\n    stats {\n      ...DeckStats\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Factions {\n  factions {\n    ...FactionFragment\n  }\n}"): (typeof documents)["query Factions {\n  factions {\n    ...FactionFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Game($id: ID!) {\n  game(id: $id) {\n    ...GameFragment\n  }\n}"): (typeof documents)["query Game($id: ID!) {\n  game(id: $id) {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeckFragment\n  }\n}"): (typeof documents)["query GameDeck($game: ID!) {\n  gameDeck(game: $game) {\n    ...GameDeckFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Games {\n  games {\n    ...GameFragment\n  }\n}"): (typeof documents)["query Games {\n  games {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}"): (typeof documents)["query Leaders($factions: [FactionKey!]) {\n  leaders(factions: $factions) {\n    ability\n    dlc {\n      name\n      image\n    }\n    id\n    image\n    name\n    quote\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...CardUnitFragment\n  }\n}"): (typeof documents)["query Units($deckable: Boolean, $factions: [FactionKey!]) {\n  units(deckable: $deckable, factions: $factions) {\n    ...CardUnitFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription DeckAdded {\n  deckAdded {\n    ...DeckFragment\n  }\n}"): (typeof documents)["subscription DeckAdded {\n  deckAdded {\n    ...DeckFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeckFragment\n    }\n    game {\n      id\n    }\n  }\n}"): (typeof documents)["subscription DeckSet {\n  deckSet {\n    deck {\n      ...GameDeckFragment\n    }\n    game {\n      id\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameAdded {\n  gameAdded {\n    ...GameFragment\n  }\n}"): (typeof documents)["subscription GameAdded {\n  gameAdded {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameReady {\n  gameReady {\n    ...GameFragment\n  }\n}"): (typeof documents)["subscription GameReady {\n  gameReady {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription GameSet {\n  gameSet {\n    ...GameFragment\n  }\n}"): (typeof documents)["subscription GameSet {\n  gameSet {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription OrderSet {\n  orderSet {\n    ...GameFragment\n  }\n}"): (typeof documents)["subscription OrderSet {\n  orderSet {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription PassPlayed {\n  passPlayed {\n    ...GameFragment\n  }\n}"): (typeof documents)["subscription PassPlayed {\n  passPlayed {\n    ...GameFragment\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeckFragment\n    }\n  }\n}"): (typeof documents)["subscription RoundEndedForDeck {\n  roundEndedForDeck {\n    game {\n      id\n    }\n    deck {\n      ...GameDeckFragment\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnitFragment\n    }\n  }\n}"): (typeof documents)["subscription UnitPlayedFromDeck {\n  unitPlayedFromDeck {\n    game {\n      id\n    }\n    unit {\n      ...DeckUnitFragment\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...GameFragment\n    }\n  }\n}"): (typeof documents)["subscription UnitPlayedOnGame {\n  unitPlayedOnGame {\n    game {\n      ...GameFragment\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnitFragment\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n}"): (typeof documents)["subscription UnitRedrawn {\n  unitRedrawn {\n    from {\n      ...DeckUnitFragment\n    }\n    game {\n      id\n    }\n    to {\n      ...DeckUnitFragment\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;