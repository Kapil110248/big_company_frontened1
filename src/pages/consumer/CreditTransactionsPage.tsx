import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tabs,
  List,
  Space,
  Tag,
  Empty,
  message,
  Badge,
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { consumerApi } from '../../services/apiService';

const { Title, Text } = Typography;

type TransactionType = 'loan_given' | 'payment_made' | 'card_order';
type TransactionFilter = 'all' | 'loan_given' | 'payment_made' | 'card_order';

interface CreditTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  reference_number: string;
  shop_name?: string;
  shop_location?: string;
  loan_number?: string;
  payment_method?: string;
  status: 'completed' | 'pending' | 'failed';
}

const CreditTransactionsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [filter, setFilter] = useState<TransactionFilter>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await consumerApi.getCreditTransactions();
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => {
      if (filter === 'loan_given') return t.type === 'loan_given';
      if (filter === 'payment_made') return t.type === 'payment_made';
      if (filter === 'card_order') return t.type === 'card_order';
      return true;
    });
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'loan_given':
        return (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f6ffed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowDownOutlined style={{ fontSize: 20, color: '#52c41a' }} />
          </div>
        );
      case 'payment_made':
        return (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowUpOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          </div>
        );
      case 'card_order':
        return (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f9f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingOutlined style={{ fontSize: 20, color: '#722ed1' }} />
          </div>
        );
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'loan_given':
        return '#52c41a';
      case 'payment_made':
        return '#1890ff';
      case 'card_order':
        return '#722ed1';
    }
  };

  const getAmountPrefix = (type: TransactionType) => {
    return type === 'loan_given' ? '+' : '-';
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'loan_given':
        return 'Loan Disbursement';
      case 'payment_made':
        return 'Payment Made';
      case 'card_order':
        return 'Card Purchase';
    }
  };

  const getCounts = () => {
    return {
      all: transactions.length,
      loan_given: transactions.filter((t) => t.type === 'loan_given').length,
      payment_made: transactions.filter((t) => t.type === 'payment_made').length,
      card_order: transactions.filter((t) => t.type === 'card_order').length,
    };
  };

  const counts = getCounts();
  const filteredTransactions = getFilteredTransactions();

  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={counts.all} offset={[10, 0]} color="#722ed1">
          <Space>
            <DollarOutlined />
            All Transactions
          </Space>
        </Badge>
      ),
    },
    {
      key: 'loan_given',
      label: (
        <Badge count={counts.loan_given} offset={[10, 0]} color="#52c41a">
          <Space>
            <CreditCardOutlined />
            Loans Given
          </Space>
        </Badge>
      ),
    },
    {
      key: 'payment_made',
      label: (
        <Badge count={counts.payment_made} offset={[10, 0]} color="#1890ff">
          <Space>
            <ArrowUpOutlined />
            Payments Made
          </Space>
        </Badge>
      ),
    },
    {
      key: 'card_order',
      label: (
        <Badge count={counts.card_order} offset={[10, 0]} color="#722ed1">
          <Space>
            <ShopOutlined />
            Card Orders
          </Space>
        </Badge>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Credit Transactions</Title>
        <Text type="secondary">View your complete credit history including loans, payments, and purchases</Text>
      </div>

      <Card>
        <Tabs
          activeKey={filter}
          onChange={(key) => setFilter(key as TransactionFilter)}
          items={tabItems}
          size="large"
        />

        <List
          loading={loading}
          dataSource={filteredTransactions}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    No {filter === 'all' ? '' : filter.replace('_', ' ')} transactions found
                  </span>
                }
              />
            ),
          }}
          renderItem={(transaction) => (
            <List.Item
              key={transaction.id}
              style={{
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <List.Item.Meta
                avatar={getTransactionIcon(transaction.type)}
                title={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>{transaction.description}</Text>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                          color: getTransactionColor(transaction.type),
                        }}
                      >
                        {getAmountPrefix(transaction.type)}
                        {transaction.amount.toLocaleString()} RWF
                      </Text>
                    </Space>

                    {transaction.shop_name && (
                      <Space size={4}>
                        <ShopOutlined style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {transaction.shop_name}
                          {transaction.shop_location && ` • ${transaction.shop_location}`}
                        </Text>
                      </Space>
                    )}

                    <Space wrap>
                      <Tag color={getTransactionColor(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Ref: {transaction.reference_number}
                      </Text>
                      {transaction.payment_method && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          via {transaction.payment_method}
                        </Text>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        {filteredTransactions.length > 0 && (
          <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>Total Transactions:</Text>
              <Text strong>{filteredTransactions.length}</Text>
            </Space>
            {filter === 'all' && (
              <>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text type="secondary">Total Loans Received:</Text>
                  <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                    +
                    {transactions
                      .filter((t) => t.type === 'loan_given')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}{' '}
                    RWF
                  </Text>
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text type="secondary">Total Payments Made:</Text>
                  <Text style={{ color: '#1890ff', fontWeight: 500 }}>
                    -
                    {transactions
                      .filter((t) => t.type === 'payment_made')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}{' '}
                    RWF
                  </Text>
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text type="secondary">Total Card Purchases:</Text>
                  <Text style={{ color: '#722ed1', fontWeight: 500 }}>
                    -
                    {transactions
                      .filter((t) => t.type === 'card_order')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}{' '}
                    RWF
                  </Text>
                </Space>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreditTransactionsPage;
