import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Input,
  Space,
  Button,
  Card,
  Typography,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Empty,
  message
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const ServiceTable = () => {
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');


  const fetchAllServices = async () => {
    try {
      let allData = [];
      let url = 'http://20.193.149.47:2242/salons/service/';
      console.log('Fetching all services...');
      
      while (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        const results = data.results || data.data || data || [];
        const pageResults = Array.isArray(results) ? results : [];
        allData = [...allData, ...pageResults];
        
        url = data.next;

        if (allData.length > 10000) break;
      }
      
      console.log('Total services fetched:', allData.length);
      setAllServices(allData);
      setServices(allData);
      setFilteredServices(allData);
      
      if (allData.length > 0) {
        message.success(`Successfully loaded ${allData.length} services`);
      }
      
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err.message);
      message.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllServices();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(allServices.map(service => 
      service.category || service.category_name || service.type || 'General'
    ))];
    return cats.filter(Boolean);
  }, [allServices]);


  useEffect(() => {
    let filtered = [...allServices];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(service => {
        const name = (service.name || service.service_name || service.title || '').toLowerCase();
        const description = (service.description || service.details || service.info || '').toLowerCase();
        const category = (service.category || service.category_name || service.type || '').toLowerCase();
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               category.includes(searchLower);
      });
    }


    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => {
        const serviceCategory = service.category || service.category_name || service.type || 'General';
        return serviceCategory === categoryFilter;
      });
    }


    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => {
        const isActive = service.is_active !== false && service.active !== false && service.status !== 'inactive';
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    if (priceRange !== 'all') {
      filtered = filtered.filter(service => {
        const price = parseFloat(service.price || service.cost || service.amount || 0);
        switch (priceRange) {
          case 'low': return price < 500;
          case 'medium': return price >= 500 && price < 1500;
          case 'high': return price >= 1500;
          default: return true;
        }
      });
    }

    setFilteredServices(filtered);
  }, [searchText, categoryFilter, statusFilter, priceRange, allServices]);


  const stats = useMemo(() => {
    const total = allServices.length;
    const active = allServices.filter(s => s.is_active !== false && s.active !== false && s.status !== 'inactive').length;
    const avgPrice = allServices.length > 0 
      ? allServices.reduce((sum, s) => sum + parseFloat(s.price || s.cost || s.amount || 0), 0) / allServices.length 
      : 0;
    const totalCategories = categories.length;

    return { total, active, avgPrice, totalCategories };
  }, [allServices, categories]);


  const columns = [
    {
      title: 'Service Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            {record.name || record.service_name || record.title || `Service ${record.id}`}
          </Text>
        </div>
      ),
      sorter: (a, b) => {
        const nameA = a.name || a.service_name || a.title || '';
        const nameB = b.name || b.service_name || b.title || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text, record) => {
        const category = record.category || record.category_name || record.type || 'General';
        const colors = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta'];
        const colorIndex = category.length % colors.length;
        return <Tag color={colors[colorIndex]}>{category}</Tag>;
      },
      filters: categories.map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) => {
        const category = record.category || record.category_name || record.type || 'General';
        return category === value;
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (text, record) => {
        const price = record.price || record.cost || record.amount;
        if (!price) return <Text type="secondary">N/A</Text>;
        return (
          <Text strong style={{ color: '#52c41a' }}>
            ₹{parseFloat(price).toFixed(2)}
          </Text>
        );
      },
      sorter: (a, b) => {
        const priceA = parseFloat(a.price || a.cost || a.amount || 0);
        const priceB = parseFloat(b.price || b.cost || b.amount || 0);
        return priceA - priceB;
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (text, record) => {
        const duration = record.duration || record.time || record.minutes;
        if (!duration) return <Text type="secondary">N/A</Text>;
        return (
          <Space>
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            <Text>{duration} mins</Text>
          </Space>
        );
      },
      sorter: (a, b) => {
        const durA = parseInt(a.duration || a.time || a.minutes || 0);
        const durB = parseInt(b.duration || b.time || b.minutes || 0);
        return durA - durB;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text, record) => {
        const description = record.description || record.details || record.info || 'No description available';
        return (
          <Text 
            ellipsis={{ tooltip: description }}
            style={{ maxWidth: 280 }}
          >
            {description}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text, record) => {
        const isActive = record.is_active !== false && record.active !== false && record.status !== 'inactive';
        return (
          <Tag color={isActive ? 'success' : 'error'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => {
        const isActive = record.is_active !== false && record.active !== false && record.status !== 'inactive';
        return value === 'active' ? isActive : !isActive;
      },
    },
  ];

  const handleReset = () => {
    setSearchText('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPriceRange('all');
    message.info('Filters cleared');
  };

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Services"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchAllServices}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
        <Card 
          style={{ 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
        >
          <div style={{ color: 'white' }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: '12px' }} />
              Service Management Dashboard
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
              Manage and browse all available services with advanced filtering
            </Text>
          </div>
        </Card>

      
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Services"
                value={stats.total}
                prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Active Services"
                value={stats.active}
                prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Average Price"
                value={stats.avgPrice}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                suffix="₹"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Categories"
                value={stats.totalCategories}
                prefix={<FilterOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Search services..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
              >
                <Option value="all">All Categories</Option>
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="Price Range"
                value={priceRange}
                onChange={setPriceRange}
              >
                <Option value="all">All Prices</Option>
                <Option value="low">Under ₹500</Option>
                <Option value="medium">₹500 - ₹1500</Option>
                <Option value="high">Above ₹1500</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchAllServices}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          
          </Row>
          <Row style={{ marginTop: '16px' }} justify="start">
              <Col xs={24} md={3}>
              <Text type="secondary">
                Showing {filteredServices.length} of {allServices.length} services
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Spin spinning={loading} tip="Loading services...">
            <Table
              columns={columns}
              dataSource={filteredServices}
              rowKey={(record) => record.id || record.pk || Math.random()}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} services`,
                pageSizeOptions: ['10', '25', '50', '100'],
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchText || categoryFilter !== 'all' || statusFilter !== 'all' || priceRange !== 'all'
                        ? "No services match your filters"
                        : "No services available"
                    }
                  />
                )
              }}
              rowClassName={(record, index) => 
                index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
              }
            />
          </Spin>
        </Card>
      </div>

      <style jsx>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default ServiceTable;