import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard } from '../../components/TransactionCard';
import { TransactionCardData } from '../../components/TransactionCard/types';
import {
  Container,
  Header, 
  UserInfo, 
  Photo, 
  User, 
  UserGreeting, 
  UserName,
  UserWrapper,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  Loader
} from './styles';
import theme from '../../global/styles/theme';
import { useAuth } from '../../hooks/auth';

interface HighlightProps {
  amount: string;
  lastTransaction?: string;
}
interface HighlightData {
  entries: HighlightProps;
  expensives: HighlightProps;
  total: HighlightProps;
}

export interface DataListProps extends TransactionCardData {
  id: string;
}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>()
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData)

  const { signOut, user } = useAuth();

  const getLastTransactionDate = (
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ) => {
    const lastTransaction = new Date(Math.max.apply(Math, collection
      .filter(transaction => transaction.type === type)
      .map(transaction => new Date(transaction.date).getTime()))
    )

    const day = lastTransaction.getDate()
    const monthLong = lastTransaction.toLocaleString('pt-BR', { month: 'long'})

    if (day) {
      return `${day && day} de ${monthLong}`
    }
  }
  
  const loadTransactions = async() => {
    const dataKey = `@gofinances:transactions_user:${user.id}`
    const response = await AsyncStorage.getItem(dataKey)
    const storagedTransactions = response ? JSON.parse(response) : []

    let entriesTotal = 0;
    let expensivesTotal = 0;

    const transactionsFormatted: DataListProps[] = storagedTransactions.map((item: DataListProps) => {

      if (item.type === 'positive') {
        entriesTotal += Number(item.amount)
      } else {
        expensivesTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date))

      return {
        id: item.id,
        name: item.name,
        amount: amount,
        type: item.type,
        category: item.category,
        date: date
      }

    })
    setTransactions(transactionsFormatted)

    const lastTransactionEntries = getLastTransactionDate(storagedTransactions, 'positive')
    const lastTransactionExpensives = getLastTransactionDate(storagedTransactions, 'negative')
    const totalInterval = lastTransactionExpensives ? `01 à ${lastTransactionExpensives}` : 'Sem registros'

    const total = entriesTotal - expensivesTotal
    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionEntries ? `Última entrada ${lastTransactionEntries}` : 'Sem registros'
      },
      expensives: {
        amount: expensivesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionExpensives ? `Última saída ${lastTransactionExpensives}` : 'Sem registros'
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    })
    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
    // AsyncStorage.removeItem(`@gofinances:transactions_user:${user.id}`)
  }, []) 

  useFocusEffect(useCallback(() => {
    loadTransactions()
  }, []))

  return (
    <Container>
      { isLoading 
        ? <Loader>
            <ActivityIndicator 
              color={theme.colors.primary}
              size="large"
            />
          </Loader> 
        : <>
            <Header>
              <UserWrapper>
                <UserInfo>
                  <Photo source={{ uri: user.photo }}/>
                  <User>
                    <UserGreeting>Olá,</UserGreeting>
                    <UserName>{user.name}</UserName>
                  </User>
                </UserInfo>

                <LogoutButton onPress={signOut}>
                  <Icon name='power'/>
                </LogoutButton>
              </UserWrapper>
            </Header>

            <HighlightCards
            >
              <HighlightCard 
                title="Entradas" 
                amount={highlightData.entries.amount} 
                lastTransaction={highlightData.entries.lastTransaction} 
                type="up" 
              />
              <HighlightCard 
                title="Saídas" 
                amount={highlightData.expensives.amount} 
                lastTransaction={highlightData.expensives.lastTransaction} 
                type="down" 
              />
              <HighlightCard 
                title="Total" 
                amount={highlightData.total.amount} 
                lastTransaction={highlightData.total.lastTransaction} 
                type="total" 
              />
            </HighlightCards>

            <Transactions>
              <Title>Listagem</Title>

              <TransactionList 
                data={transactions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <TransactionCard data={item} />}
              />
            </Transactions> 
          </>
      }
    </Container>
  )
}
