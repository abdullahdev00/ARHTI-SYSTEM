# SearchHeader Component Usage Guide

## 🎯 Reusable WhatsApp-Style Search Header

The `SearchHeader` component provides a professional WhatsApp-style search interface that can be used in any screen.

## 📱 Features

- **Full header width** - Uses complete header space
- **WhatsApp-style design** - Professional appearance
- **Dark mode support** - Automatic theme adaptation
- **Optional filter button** - With badge indicator
- **Customizable placeholder** - Screen-specific text
- **Touch optimized** - Proper button sizes

## 🔧 Basic Usage

```typescript
import { SearchHeader } from '../components/ui';

// In your screen component
const [isSearchVisible, setIsSearchVisible] = useState(false);
const [searchQuery, setSearchQuery] = useState('');

React.useLayoutEffect(() => {
  if (isSearchVisible) {
    // Search mode - replace entire header
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => {
            setSearchQuery('');
            setIsSearchVisible(false);
          }}
          placeholder="Search items..."
        />
      ),
      headerRight: () => null,
    });
  } else {
    // Normal mode
    navigation.setOptions({
      headerTitle: 'Your Screen',
      headerLeft: undefined,
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
          <Ionicons name="search" size={22} color="#1c1c1e" />
        </TouchableOpacity>
      ),
    });
  }
}, [navigation, isSearchVisible, searchQuery]);
```

## 🎛️ With Filter Button

```typescript
<SearchHeader
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onClose={() => setIsSearchVisible(false)}
  onFilterPress={() => setIsFilterModalOpen(true)}
  filterCount={getActiveFiltersCount()}
  placeholder="Search partners..."
/>
```

## 📱 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `searchQuery` | `string` | ✅ | Current search query value |
| `onSearchChange` | `(query: string) => void` | ✅ | Search input change handler |
| `onClose` | `() => void` | ✅ | Back button press handler |
| `onFilterPress` | `() => void` | ❌ | Filter button press handler |
| `filterCount` | `number` | ❌ | Active filter count for badge |
| `placeholder` | `string` | ❌ | Search input placeholder text |

## 🎨 Design Features

- **36px buttons** - Optimal touch targets
- **22px border radius** - Modern rounded design
- **16px padding** - Professional spacing
- **Dark mode support** - Automatic color adaptation
- **Filter badge** - Shows active filter count
- **Auto focus** - Keyboard opens immediately

## 📱 Usage Examples

### Dashboard Search
```typescript
<SearchHeader
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onClose={() => setIsSearchVisible(false)}
  placeholder="Search dashboard..."
/>
```

### Inventory Search with Filters
```typescript
<SearchHeader
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onClose={() => setIsSearchVisible(false)}
  onFilterPress={() => setShowFilters(true)}
  filterCount={activeFilters.length}
  placeholder="Search inventory..."
/>
```

### Reports Search
```typescript
<SearchHeader
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onClose={() => setIsSearchVisible(false)}
  placeholder="Search reports..."
/>
```

## 🚀 Benefits

- **Reusable** - Use in any screen
- **Consistent** - Same design everywhere
- **Maintainable** - Single component to update
- **Professional** - WhatsApp-style appearance
- **Flexible** - Optional filter button
- **Responsive** - Works on all screen sizes
