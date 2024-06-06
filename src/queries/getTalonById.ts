import gql from 'graphql-tag'

const GET_TALON_BY_ID = gql`
  query getTalonById($id: Int!) {
    talonById(id: $id) {
      id
      name
      ordinal
      purpose {
        name
        description
      }
      logs {
        id
        action
        comment
        createdAt
      }
    }
    countActiveTalons
  }
`
export default GET_TALON_BY_ID
