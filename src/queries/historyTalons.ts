import gql from 'graphql-tag';

export const TALONS = gql`
  query ($limit: Int, $offset: Int) {
    historyTalons(pagination: { limit: $limit, offset: $offset }) {
      id
      name
      logs {
        action
        createdBy {
          username
          operatorSettings {
            location {
              name
            }
          }
        }
      }
    }
  }
`;
interface tabloTalonLog {
  id: number;
  action: string;
  createdBy: {
    username: string;
    operatorSettings?: {
      location: {
        name: string;
      };
    };
  };
}
export interface HistoryTalon {
  id: number;
  name: string;
  logs: tabloTalonLog[];
}
