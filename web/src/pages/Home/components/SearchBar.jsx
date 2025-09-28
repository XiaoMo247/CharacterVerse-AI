import { Input } from 'antd'

const { Search } = Input

const SearchBar = ({ onSearch, loading = false, placeholder = "输入关键词搜索..." }) => {
  return (

      <Search
        placeholder={placeholder}
        allowClear
        enterButton="搜索"
        size="large"
        onSearch={onSearch}
        loading={loading}
        style={{ maxWidth: '100%', margin: '0 auto', display: 'block' }}
      />
  )
}

export default SearchBar