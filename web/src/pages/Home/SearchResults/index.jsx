import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Row, Col, Button, Spin, Empty, Pagination } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer, CharacterCard } from '../../../components'
import { searchList } from '../server/homeService'
import useChatStore from '../../Chat/store/useChatStore'

const SearchResults = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const { setPendingCharacter } = useChatStore()
  
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // 搜索函数
  const handleSearch = async (searchKeyword, currentPage = 1) => {
    if (!searchKeyword.trim()) return

    setLoading(true)
    try {
      const response = await searchList({
        keyword: searchKeyword,
        page: currentPage,
        pageSize
      })
      
      if (response?.data?.list) {
        setSearchResults(response.data.list)
        setTotal(response.data.total || 0)
      } else {
        setSearchResults([])
        setTotal(0)
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 初始搜索
  useEffect(() => {
    if (keyword) {
      handleSearch(keyword, 1)
      setPage(1)
    }
  }, [keyword])

  // 分页变化处理
  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage)
    handleSearch(keyword, newPage)
  }

  // 返回首页
  const handleBack = () => {
    navigate('/')
  }

  // 角色聊天跳转
  const handleChat = (character) => {
    setPendingCharacter(character)
    navigate('/chat')
  }

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: '1rem' }}
        >
          返回首页
        </Button>
        
        <h2 style={{ margin: 0 }}>
          搜索结果: "{keyword}" 
          {total > 0 && <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>
            （共找到 {total} 个结果）
          </span>}
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spin size="large" />
        </div>
      ) : searchResults.length > 0 ? (
        <Row gutter={[16, 16]}>
          {searchResults.map((character) => (
            <Col xs={24} sm={12} md={8} lg={6} key={character.id}>
              <CharacterCard 
                character={character}
                onChat={() => handleChat(character)}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty 
          description={`没有找到与 "${keyword}" 相关的角色`}
          style={{ padding: '2rem' }}
        />
      )}

      {/* 分页器 */}
      {total > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '2rem',
          padding: '1rem 0'
        }}>
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={handlePageChange}
          />
        </div>
      )}
    </PageContainer>
  )
}

export default SearchResults