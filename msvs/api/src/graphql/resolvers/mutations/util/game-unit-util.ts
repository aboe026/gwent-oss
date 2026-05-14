import { GameUnitType } from '@gwent/graphql-schema'
import {
  DeckUnitDbObject,
  FieldUnitDbObject,
  GameUnitDbObject,
  WeatherUnitDbObject,
} from '@gwent/graphql-schema/database-typings'

export default class GameUnitUtil {
  static convertDeckUnitToGameUnit(deckUnit: DeckUnitDbObject): GameUnitDbObject {
    return {
      artStyle: deckUnit.artStyle,
      type: GameUnitType.Deck,
      unit: deckUnit.unit,
    }
  }

  static convertFieldUnitToGameUnit(fieldUnit: FieldUnitDbObject): GameUnitDbObject {
    return {
      artStyle: fieldUnit.artStyle,
      row: fieldUnit.row,
      type: GameUnitType.Field,
      unit: fieldUnit.unit,
      effectiveStrength: fieldUnit.effectiveStrength,
      effects: fieldUnit.effects,
    }
  }

  static convertWeatherUnitToGameUnit(weatherUnit: WeatherUnitDbObject): GameUnitDbObject {
    return {
      artStyle: weatherUnit.artStyle,
      type: GameUnitType.Weather,
      unit: weatherUnit.unit,
    }
  }
}
