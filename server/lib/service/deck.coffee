_ = require("lodash")


cidFor = (suite, type) -> "#{suite.id}-#{type.id}"

suites =
  Spades  :
    id: 's'
  Hearts  :
    id: 'h'
  Diamonds:
    id: 'd'
  Clubs   :
    id: 'c'

types =
  Queen:
    id   : 'Q'
    score: 3
  Jack :
    id   : 'J'
    score: 2
  King :
    id   : 'K'
    score: 4
  Ace  :
    id   : 'A'
    score: 11
  T10  :
    id   : '10'
    score: 10
  T9   :
    id   : '9'
    score: 0
  T8   :
    id   : '8'
    score: 0
  T7   :
    id   : '7'
    score: 0

orderTable =

  nonTrumpsTypes: [
    types.Ace.id
    types.T10.id
    types.King.id
    types.T9.id
    types.T8.id
    types.T7.id
  ]

  trumps: [
    cidFor(suites.Clubs, types.T7)
    cidFor(suites.Clubs, types.Queen)
    cidFor(suites.Spades, types.Queen)
    cidFor(suites.Hearts, types.Queen)
    cidFor(suites.Diamonds, types.Queen)
    cidFor(suites.Clubs, types.Jack)
    cidFor(suites.Spades, types.Jack)
    cidFor(suites.Hearts, types.Jack)
    cidFor(suites.Diamonds, types.Jack)
    cidFor(suites.Clubs, types.Ace)
    cidFor(suites.Clubs, types.T10)
    cidFor(suites.Clubs, types.King)
    cidFor(suites.Clubs, types.T9)
    cidFor(suites.Clubs, types.T8)
  ]

randomize = (values) ->
  n = Math.floor(Math.random() * 400 + 10)
  _.times n, -> values = _.shuffle(values)
  values

isTrump = (suite, type) ->
  suite.id is suites.Clubs.id or
  type.id is types.Queen.id or
  type.id is types.Jack.id

# create initial deck
initialDeck = {}
for suiteName, suite of suites
  for typeName, type of types
    id = cidFor suite, type
    initialDeck[id] =
      id     : id
      suite  : suite
      type   : type
      score  : type.score
      isTrump: isTrump suite, type

module.exports =

  suites: suites

  types  : types

  # Shuffle deck for specified number of parts.
  #
  # @param {Number} count
  # @return {Array}
  shuffle: (count) ->
    randomized = randomize(v for k, v of initialDeck)
    groups = _.groupBy randomized, (value, index) -> index % count
    group.map((card) -> card.id) for k, group of groups

  getScore: (cid) ->
    initialDeck[cid].score

  cidFor: cidFor

  beats: (attackCid, defendCid) ->
    a = initialDeck[attackCid]
    d = initialDeck[defendCid]
    nt = orderTable.nonTrumpsTypes
    twA = orderTable.trumps.indexOf(attackCid)
    twD = orderTable.trumps.indexOf(defendCid)
    ntA = nt.indexOf(a.type.id)
    ntD = nt.indexOf(d.type.id)
    if a.isTrump and d.isTrump
      twA < twD
    else if a.isTrump and !d.isTrump
      true
    else if !a.isTrump and d.isTrump
      false
    else if a.suite.id isnt d.suite.id
      false
    else
      ntA < ntD

  sort: (cids) ->
    groups = trumps: []
    groups[suites.Spades.id] = []
    groups[suites.Hearts.id] = []
    groups[suites.Diamonds.id] = []

    cids.forEach (cid) ->
      card = initialDeck[cid]
      if card.isTrump
        groups.trumps.push cid
      else
        groups[card.suite.id].push cid

    # TODO: check that works without braces
    [].concat(
      _.sortBy groups.trumps, (cid) -> orderTable.trumps.indexOf cid
      _.sortBy groups[suites.Spades.id], (cid) -> orderTable.nonTrumpsTypes.indexOf initialDeck[cid].type.id
      _.sortBy groups[suites.Hearts.id], (cid) -> orderTable.nonTrumpsTypes.indexOf initialDeck[cid].type.id
      _.sortBy groups[suites.Diamonds.id], (cid) -> orderTable.nonTrumpsTypes.indexOf initialDeck[cid].type.id
    )

  group: (cids, firstCid) ->
    firstCard =  if firstCid then initialDeck[firstCid] else null
    groups =
      suite       : [],
      trumps      : [],
      nonTrumps   : [],
      isFirstTrump: if firstCard then firstCard.isTrump else null

    cids.forEach (cid) ->
      card = initialDeck[cid]
      if card.isTrump
        groups.trumps.push cid
      else
        groups.nonTrumps.push cid
        if firstCard and card.suite.id is firstCard.suite.id
          groups.suite.push cid
    groups
