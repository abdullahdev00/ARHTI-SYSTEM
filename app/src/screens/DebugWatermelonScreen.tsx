import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { database } from '../database'

interface TableData {
    name: string
    count: number
    rows: any[]
}

export const DebugWatermelonScreen = () => {
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const [tables, setTables] = useState<TableData[]>([])
    const [selectedTable, setSelectedTable] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAllData()
    }, [])

    const loadAllData = async () => {
        try {
            setLoading(true)
            const tableNames = ['partners', 'invoices', 'stock_items', 'charges', 'categories', 'purchases', 'roles']
            const allTables: TableData[] = []

            for (const tableName of tableNames) {
                try {
                    const rows = await database.get(tableName).query().fetch()
                    allTables.push({
                        name: tableName,
                        count: rows.length,
                        rows: rows.map((row: any) => {
                            const obj: any = {}
                            Object.keys(row).forEach(key => {
                                if (!key.startsWith('_')) {
                                    obj[key] = row[key]
                                }
                            })
                            return obj
                        })
                    })
                } catch (error) {
                    console.error(`Error loading ${tableName}:`, error)
                }
            }

            setTables(allTables)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedTableData = tables.find(t => t.name === selectedTable)

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Header */}
            <View style={[styles.header, isDark && styles.headerDark]}>
                <Text style={[styles.title, isDark && styles.titleDark]}>🔍 WatermelonDB Debug</Text>
                <TouchableOpacity onPress={loadAllData} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color="#10b981" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <Text style={[styles.loadingText, isDark && styles.textDark]}>Loading...</Text>
                </View>
            ) : (
                <ScrollView style={styles.content}>
                    {/* Table List */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>📊 Tables</Text>
                        {tables.map(table => (
                            <TouchableOpacity
                                key={table.name}
                                style={[
                                    styles.tableButton,
                                    isDark && styles.tableButtonDark,
                                    selectedTable === table.name && styles.tableButtonActive
                                ]}
                                onPress={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                            >
                                <View style={styles.tableButtonContent}>
                                    <Text style={[styles.tableName, isDark && styles.textDark]}>
                                        {table.name}
                                    </Text>
                                    <Text style={[styles.tableCount, isDark && styles.textDark]}>
                                        {table.count} rows
                                    </Text>
                                </View>
                                <Ionicons
                                    name={selectedTable === table.name ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={isDark ? '#fff' : '#000'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Table Data */}
                    {selectedTableData && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                                📋 {selectedTableData.name} ({selectedTableData.count})
                            </Text>

                            {selectedTableData.rows.length === 0 ? (
                                <Text style={[styles.emptyText, isDark && styles.textDark]}>No data</Text>
                            ) : (
                                <FlatList
                                    scrollEnabled={false}
                                    data={selectedTableData.rows}
                                    keyExtractor={(_, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <View style={[styles.rowContainer, isDark && styles.rowContainerDark]}>
                                            <Text style={[styles.rowIndex, isDark && styles.textDark]}>
                                                Row {index + 1}
                                            </Text>
                                            {Object.entries(item).map(([key, value]: [string, any]) => (
                                                <View key={key} style={styles.fieldRow}>
                                                    <Text style={[styles.fieldKey, isDark && styles.textDark]}>
                                                        {key}:
                                                    </Text>
                                                    <Text
                                                        style={[styles.fieldValue, isDark && styles.fieldValueDark]}
                                                        numberOfLines={2}
                                                    >
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    containerDark: {
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerDark: {
        backgroundColor: '#1c1c1e',
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    titleDark: {
        color: '#fff',
    },
    refreshBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 12,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000',
    },
    tableButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tableButtonDark: {
        backgroundColor: '#1c1c1e',
        borderColor: '#333',
    },
    tableButtonActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    tableButtonContent: {
        flex: 1,
    },
    tableName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    tableCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    rowContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    rowContainerDark: {
        backgroundColor: '#1c1c1e',
        borderColor: '#333',
    },
    rowIndex: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
        marginBottom: 8,
    },
    fieldRow: {
        marginBottom: 6,
    },
    fieldKey: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
    },
    fieldValue: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
    },
    fieldValueDark: {
        backgroundColor: '#333',
        color: '#ccc',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
    textDark: {
        color: '#fff',
    },
})
