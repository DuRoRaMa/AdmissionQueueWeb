import gql from 'graphql-tag'

const GET_TALON_BY_ID = gql`
  query getTalonById($id: Int!) {
    talonById(id: $id) {
      id
      name
      ordinal
      purpose {
        name
      }
      logs {
        id
        action
        comment
        createdAt
      }
    }
  }
`
export default GET_TALON_BY_ID
