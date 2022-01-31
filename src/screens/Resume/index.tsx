import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { categories } from '../../utils/categories'
import { HistoryCard } from '../../components/HistoryCard';
import { Container, Header, Title, Content } from './styles';

interface TransactionData {
  type: 'positive' | 'negative'
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryData {
  key: string;
  name: string;
  total: string;
  color: string;
}

export const Resume = () => {
  const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>()

  const loadData = async () => {
    const dataKey = '@gofinances:transactions'
    const response = await AsyncStorage.getItem(dataKey)
    const responseFormatted = response ? JSON.parse(response) : []

    const expensives = responseFormatted.filter((expensive: TransactionData) => expensive.type === 'negative')

    const totalByCategory: CategoryData[] = []

    categories.forEach((category) => {
      let categorySum = 0

      expensives.forEach((expensive: TransactionData) => {
        if (expensive.category === category.key) {
          categorySum += Number(expensive.amount)
        }
      });

      if (categorySum > 0) {
        totalByCategory.push({
          key: category.key,
          name: category.name,
          color: category.color,
          total: categorySum.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })
        });
      };
    })

    setTotalByCategories(totalByCategory)
  }

  useEffect(() => {
    loadData()
  }, [])
  return (
    <Container>
      <Header>
        <Title>Resumo por categoria</Title>
      </Header>

      <Content>
        {totalByCategories?.map(item => (
          <HistoryCard 
            key={item.key}
            title={item.name}
            amount={item.total}
            color={item.color}
          />
        ))}
      </Content>
    </Container>
  )
}