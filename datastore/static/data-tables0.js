let dataTables = []

function initTables(className, dataFormat, allowColumnResize=false, allowFilter=false, allowSort=false, allowPagination=false) {
    if (!allowColumnResize && !allowFilter && !allowSort && !allowPagination) return
    buildDataTables(className, dataFormat)
    if (allowColumnResize) resizeTables(className)
    if (allowFilter) filterTables(className)
    if (allowSort) sortTables(className)
    if (allowPagination) paginateTables(className)
}

function tableFromData(data, container, tag) {
    // TODO - take a JSON/CSV and create a table
}

function clearDataTable(className, index) {
    const table = document.getElementsByClassName(`data-table-${className}-${index}`)[0]
    const rows = table.tagName == 'TABLE' ? table.rows : table.children

    for (let i = rows.length - 1; i > 0; i--) {
        if (table.tagName == 'TABLE') {
            table.deleteRow(i)
        } else {
            table.removeChild(rows[i])
        }
    }
}

function createTableHeader(className, index) {
    // TODO
}

function createDataTable(className, index) {
    if (!(`data-table-${className}-${index}` in dataTables)) return
    const table = document.getElementsByClassName(`data-table-${className}-${index}`)[0]
    const headers = dataTables[`data-table-${className}-${index}`]['headers']
    const type = dataTables[`data-table-${className}-${index}`]['type']
    let data = dataTables[`data-table-${className}-${index}`]['data']
    const filters = dataTables[`data-table-${className}-${index}`]['filters']
    const sort = dataTables[`data-table-${className}-${index}`]['sort']
    const sortOrder = dataTables[`data-table-${className}-${index}`]['sortOrder']

    let widths = []
    const rows = table.tagName == 'TABLE' ? table.rows : table.children
    for (let i = 0; i < rows[0].children.length; i++) {
        widths.push(rows[0].children[i].style.width)
    }

    let filteredColumns = []
    if (filters.length > 0) {
        let filtered = []
        for (let i = 0; i < data.length; i++) {
            let ok = ''
            for (let filter of filters) {
                const columnNumber = headers.indexOf(filter['column'])
                const column = type == 'array' ? columnNumber : filter['column']

                let include = false
                if (filter['type'] == 'match') {
                    include = removeHTML(data[i][column]) == filter['value']
                } else {
                    include = removeHTML(data[i][column]).toUpperCase().indexOf(filter['value'].toUpperCase()) > -1
                }
                if (include) {
                    filtered.push(data[i])
                    if (!filteredColumns.includes(columnNumber)) filteredColumns.push(columnNumber)
                    break
                }
            }
        }
        data = filtered
    }
    if (document.getElementsByClassName(`filter_icon_${className}_${index}_0`).length > 0) {
        for (let i = 0; i < headers.length; i++) {
            document.getElementsByClassName(`filter_icon_${className}_${index}_${i}`)[0].classList.remove('active')
            if (filters.find(item => item['column'] == headers[i])) {
                document.getElementsByClassName(`filter_icon_${className}_${index}_${i}`)[0].classList.add('active')
            }
        }
    }

    if (sort > -1) {
        if (type == 'array') {
            if (sortOrder == 'asc') {
                data.sort((a, b) => (a[sort] > b[sort]) ? 1 : ((b[sort] > a[sort]) ? -1 : 0))
            } else {
                data.sort((a, b) => (b[sort] > a[sort]) ? 1 : ((a[sort] > b[sort]) ? -1 : 0))
            }
        } else {
            if (sortOrder == 'asc') {
                data.sort((a, b) => (a[headers[sort]] > b[headers[sort]]) ? 1 : ((b[headers[sort]] > a[headers[sort]]) ? -1 : 0))
            } else {
                data.sort((a, b) => (b[headers[sort]] > a[headers[sort]]) ? 1 : ((a[headers[sort]] > b[headers[sort]]) ? -1 : 0))
            }
        }
    }
    if (document.getElementsByClassName(`sort_icon_${className}_${index}_0`).length > 0) {
        for (let i = 0; i < headers.length; i++) {
            document.getElementsByClassName(`sort_icon_${className}_${index}_${i}`)[0].classList.remove('activeasc')
            document.getElementsByClassName(`sort_icon_${className}_${index}_${i}`)[0].classList.remove('activedesc')
            if (sort == i) {
                document.getElementsByClassName(`sort_icon_${className}_${index}_${i}`)[0].classList.add(`active${sortOrder}`)
            }
        }
    }

    clearDataTable(className, index)
    for (let i = 0; i < data.length; i++) {
        let row = document.createElement(dataTables[`data-table-${className}-${index}`]['tag'] == 'TABLE' ? 'tr' : 'div')
        row.classList.add('table_row')
        for (let j = 0; j < headers.length; j++) {
            let cell = document.createElement(dataTables[`data-table-${className}-${index}`]['tag'] == 'TABLE' ? 'td' : 'div')
            cell.classList.add('table_column')
            cell.style.width = widths[j]
            cell.setAttribute('data-column', `${index}_${j}`)
            cell.innerHTML = data[i][type == 'array' ? j : headers[j]]
            row.appendChild(cell)
        }

        if (dataTables[`data-table-${className}-${index}`]['tag'] == 'TABLE') {
            table.getElementsByTagName('tbody')[0].appendChild(row)
        } else {
            table.appendChild(row)
        }
    }
}

function buildDataTables(className, type) {
    const tables = document.getElementsByClassName(className)
    for (let i = 0; i < tables.length; i++) {
        tables[i].classList.add(`data-table-${className}-${i}`)
        buildDataTable(className, i, type, true)
        fixTable(className, i)
    }
}

function buildDataTable(className, index, type, hasHeader) {
    const table = document.getElementsByClassName(`data-table-${className}-${index}`)[0]
    let headers = []
    let data = []

    const rows = table.tagName == 'TABLE' ? table.rows : table.children
    for (let i = 0; i < rows.length; i++) {
        if (i == 0) {
            for (let j = 0; j < rows[i].children.length; j++) {
                headers.push(rows[i].children[j].innerText)
            }
        }

        if (!(i >= hasHeader ? 0 : -1)) {
            let row = type == 'array' ? [] : {}
            for (let j = 0; j < rows[i].children.length; j++) {
                if (type == 'array') {
                    row.push(rows[i].children[j].innerHTML)
                } else {
                    row[headers[j]] = rows[i].children[j].innerHTML
                }
            }
            data.push(row)
        }
    }
    dataTables[`data-table-${className}-${index}`] = { 'headers': headers, 'data': data, 'type': type, 'tag': table.tagName, 'sort': -1, 'sortOrder': 'asc', 'filters': [], 'page': -1, 'pageSize': -1 }
}

function fixTable(className, index) {
    const table = document.getElementsByClassName(className)[index]
    const rows = table.tagName == 'TABLE' ? table.rows : table.children

    for (let j = 0; j < rows.length; j++) {
        rows[j].classList.add('table_row')
        rows[j].classList.add(`table_row_${j}`)
        if (j == 0) {
            columns = rows[j].children.length
            rows[j].style.position = 'sticky'
            rows[j].style.top = '0px'
            rows[j].style.zIndex = '2'

            for (let k = 0; k < rows[j].children.length; k++) {
                rows[j].children[k].onmouseover = function (e) {
                    this.getElementsByClassName('icons')[0].style.visibility = 'visible'
                    e.stopPropagation()
                }
                rows[j].children[k].onmouseout = function (e) {
                    this.getElementsByClassName('icons')[0].style.visibility = 'hidden'
                }
            }
        }

        if (table.tagName == 'TABLE') {
            if (j == 0) {
                if (rows[j].parentElement.tagName != 'THEAD') {
                    if (!table.getElementsByTagName('thead')[0]) {
                        let thead = document.createElement('thead')
                        table.insertBefore(thead, table.firstChild)
                    }
                }

                for (let k = 0; k < rows[j].children.length; k++) {
                    if (rows[j].children[k].tagName == 'TD') {
                        let th = document.createElement('th')
                        th.innerHTML = rows[j].children[k].innerHTML
                        rows[j].children[k].parentNode.replaceChild(th, rows[j].children[k])
                    }
                    rows[j].children[k].classList.add('table_column')
                    rows[j].children[k].setAttribute('data-column', `${index}_${k}`)
                    rows[j].children[k].style.width = `${100 / columns}%`
                }
                table.getElementsByTagName('thead')[0].appendChild(rows[j])
            } else {
                if (rows[j].parentElement.tagName != 'TBODY') {
                    if (!table.getElementsByTagName('tbody')[0]) {
                        let tbody = document.createElement('tbody')
                        table.insertAfter(tbody, table.firstChild)
                    }
                }

                for (let k = 0; k < rows[j].children.length; k++) {
                    rows[j].children[k].classList.add('table_column')
                    rows[j].children[k].setAttribute('data-column', `${index}_${k}`)
                    rows[j].children[k].style.width = `${100 / columns}%`
                }
            }
        } else {
            for (let k = 0; k < rows[j].children.length; k++) {
                rows[j].children[k].classList.add('table_column')
                rows[j].children[k].setAttribute('data-column', `${index}_${k}`)
                rows[j].children[k].style.width = `${100 / columns}%`
            }
        }
    }
}

function resizeTables(className) {
    const tables = document.getElementsByClassName(className)
    for (let i = 0; i < tables.length; i++) {
        let columns = 0
        const rows = tables[i].tagName == 'TABLE' ? tables[i].rows : tables[i].children
        for (let j = 0; j < rows.length; j++) {
            for (let k = 0; k < rows[j].children.length; k++) {
                if (j == 0 && k < rows[j].children.length - 1) {
                    let resize = document.createElement('span')
                    resize.classList.add('table_drag')
                    rows[j].children[k].appendChild(resize)
                }
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const allResize = document.getElementsByClassName('table_drag')
        for (let i = 0; i < allResize.length; i++) {
            const resize = allResize[i]
            const leftCol = resize.parentElement
            const columnNumber = resize.parentElement.getAttribute('data-column')
            const rightCol = resize.parentElement.nextElementSibling
            let x = 0, y = 0, leftWidth = 0

            const mouseDownHandler = function (e) {
                x = e.clientX
                y = e.clientY
                tableWidth = resize.parentElement.parentNode.getBoundingClientRect().width
                leftWidth = leftCol.getBoundingClientRect().width
                rightWidth = rightCol.getBoundingClientRect().width

                document.addEventListener('mousemove', mouseMoveHandler)
                document.addEventListener('mouseup', mouseUpHandler)
            }

            const mouseMoveHandler = function (e) {
                const relativeWidth = (width) => {
                    return (width / tableWidth) * 100
                }
                const dx = e.clientX - x
                const dy = e.clientY - y
                const resizeDistance = relativeWidth(leftWidth) - (((leftWidth + dx) * 100) / tableWidth)
                leftCols = document.querySelectorAll(`[data-column="${columnNumber}"]`)
                for (let i = 0; i < leftCols.length; i++) {
                    leftCols[i].style.width = `${relativeWidth(leftWidth) - resizeDistance}%`
                    leftCols[i].nextElementSibling.style.width = `${relativeWidth(rightWidth) + resizeDistance}%`
                }

                resize.style.cursor = 'col-resize'
                document.body.style.cursor = 'col-resize'

                leftCol.style.userSelect = 'none'
                leftCol.style.pointerEvents = 'none'

                rightCol.style.userSelect = 'none'
                rightCol.style.pointerEvents = 'none'
            }

            const mouseUpHandler = function () {
                resize.style.removeProperty('cursor')
                document.body.style.removeProperty('cursor')

                leftCol.style.removeProperty('user-select')
                leftCol.style.removeProperty('pointer-events')

                rightCol.style.removeProperty('user-select')
                rightCol.style.removeProperty('pointer-events')

                document.removeEventListener('mousemove', mouseMoveHandler)
                document.removeEventListener('mouseup', mouseUpHandler)
            }

            resize.addEventListener('mousedown', mouseDownHandler)
        }
    })
}

function filterTables(className) {
    const tables = document.getElementsByClassName(className)
    for (let i = 0; i < tables.length; i++) {
        const rows = tables[i].tagName == 'TABLE' ? tables[i].rows : tables[i].children
        const rowHeight = rows[0].getBoundingClientRect().height
        for (let j = 0; j < rows[0].children.length; j++) {
            let icons = rows[0].children[j].getElementsByClassName('icons')
            if (icons.length == 0) {
                icons = document.createElement('div')
                icons.classList.add('icons')
                rows[0].children[j].appendChild(icons)
            } else {
                icons = icons[0]
            }

            let icon = document.createElement('span')
            icon.classList.add('filter_icon')
            icon.classList.add(`filter_icon_${className}_${i}_${j}`)
            icon.innerHTML = `<svg height="${rowHeight - 6}" width="${rowHeight - 6}" viewBox="0 0 20 20"><polygon points="0,1 8,12 8,20 12,16 12,12 20,1" fill="#fff" stroke="#555" stroke-width="1" /></svg>`
            icon.onclick = function (e) {
                if (document.getElementById(`filter_${className}_${rows[0].children[j].getAttribute('data-column')}`).style.display == 'block') {
                    document.getElementById(`filter_${className}_${rows[0].children[j].getAttribute('data-column')}`).style.display = 'none'
                    document.getElementById(`filter_${className}_${rows[0].children[j].getAttribute('data-column')}`).parentElement.style.overflow = 'hidden'
                } else {
                    populateFilterValues(className, `${rows[0].children[j].getAttribute('data-column')}`)
                    document.getElementById(`filter_${className}_${rows[0].children[j].getAttribute('data-column')}`).style.display = 'block'
                    document.getElementById(`filter_${className}_${rows[0].children[j].getAttribute('data-column')}`).parentElement.style.overflow = 'visible'
                }
            }
            icons.appendChild(icon)

            let filter = document.createElement('div')
            filter.setAttribute('id', `filter_${className}_${rows[0].children[j].getAttribute('data-column')}`)
            filter.classList.add('filter')
            filter.style.top = `${rowHeight - 2}px`
            filter.onmouseover = function (e) {
                this.style.display = 'block'
                e.stopPropagation()
            }
            filter.onmouseout = function (e) {
                if (['INPUT', 'P', 'UL', 'LI', 'LABEL'].includes(e.toElement.tagName)) return
                this.style.display = 'none'
                this.parentElement.style.overflow = 'hidden'
            }
            rows[0].children[j].appendChild(filter)
        }
    }
}

function populateFilterValues(className, cells) {
    if (document.getElementById(`filter_${className}_${cells}`).innerHTML != '') return
    let values = []
    const table = cells.split('_')[0]
    const column = cells.split('_')[1]
    const headers = dataTables[`data-table-${className}-${table}`]['headers']
    const type = dataTables[`data-table-${className}-${table}`]['type']
    const data = dataTables[`data-table-${className}-${table}`]['data']

    for (let i = 0; i < data.length; i++) {
        if (type == 'array') {
            if (!values.includes(data[i][column])) {
                values.push(removeHTML(data[i][column]))
            }
        } else {
            if (!values.includes(data[i][headers[column]])) {
                values.push(removeHTML(data[i][headers[column]]))
            }
        }
    }

    values = values.sort()
    html = `<input type="text" oninput="applyFilterValue('${className}', '${cells}', this.value)"><ul>`
    if (values.length > 30) {
        html += '<li><p>Too many options to list<br>use search above to filter</p></li>'
    } else {
        for (let i = 0; i < values.length; i++) {
            html += `<li><label><input type="checkbox" id="filtervalue_${cells}__${i}" onclick="applyFilterValues('${className}', '${cells}')"> ${values[i]}</label></li>`
        }
    }
    html += '</ul>'
    document.getElementById(`filter_${className}_${cells}`).innerHTML = html
}

function applyFilterValue(className, cells, text) {
    const table = cells.split('_')[0]
    const column = cells.split('_')[1]
    const columnName = dataTables[`data-table-${className}-${table}`]['headers'][parseInt(column, 10)]
    let filters = dataTables[`data-table-${className}-${table}`]['filters']

    const found = filters.reduce(function (current, item, index) {
        if (item['column'] == columnName && item['type'] == 'search' && current === -1) {
            return index
        }
        return current
    }, -1)

    if (found > -1) {
        filters[found]['value'] = text
    } else {
        filters.push({ 'column': columnName, 'value': text, 'type': 'search' })
    }
    dataTables[`data-table-${className}-${table}`]['filters'] = filters
    createDataTable(className, table)
}

function applyFilterValues(className, cells) {
    const table = cells.split('_')[0]
    const column = cells.split('_')[1]
    const columnName = dataTables[`data-table-${className}-${table}`]['headers'][parseInt(column, 10)]
    let filters = dataTables[`data-table-${className}-${table}`]['filters']
    const values = document.querySelectorAll(`[id^="filtervalue_${cells}__"]`)
    for (let i = 0; i < values.length; i++) {
        if (values[i].checked) {
            if (!(filters.some(item => item['column'] == columnName && item['value'] == values[i].parentElement.innerText))) {
                filters.push({ 'column': columnName, 'value': values[i].parentElement.innerText.trim(), 'type': 'match' })
            }
        } else {
            filters = filters.filter(item => {
                return item['column'] == columnName && item['value'] == values[i].parentElement.innerText.trim() ? false : true
            })
        }
    }
    dataTables[`data-table-${className}-${table}`]['filters'] = filters
    createDataTable(className, table)
}

function sortTables(className) {
    const tables = document.getElementsByClassName(className)
    for (let i = 0; i < tables.length; i++) {
        const rows = tables[i].tagName == 'TABLE' ? tables[i].rows : tables[i].children
        const rowHeight = rows[0].getBoundingClientRect().height
        for (let j = 0; j < rows[0].children.length; j++) {
            let icons = rows[0].children[j].getElementsByClassName('icons')
            if (icons.length == 0) {
                icons = document.createElement('div')
                icons.classList.add('icons')
                rows[0].children[j].appendChild(icons)
            } else {
                icons = icons[0]
            }

            let icon = document.createElement('span')
            icon.classList.add('sort_icon')
            icon.classList.add(`sort_icon_${className}_${i}_${j}`)
            icon.innerHTML = `<svg height="${rowHeight - 6}" width="${rowHeight - 12}" viewBox="0 0 14 20"><polygon points="0,8 7,1 14,8" fill="#fff" stroke="#555" stroke-width="1" class="desc" /><polygon points="0,12 7,19 14,12" fill="#fff" stroke="#555" stroke-width="1" class="asc" /></svg>`
            icon.onclick = function (e) {
                if (dataTables[`data-table-${className}-${i}`]['sort'] == j) {
                    dataTables[`data-table-${className}-${i}`]['sortOrder'] = dataTables[`data-table-${className}-${i}`]['sortOrder'] == 'asc' ? 'desc' : 'asc'
                } else {
                    dataTables[`data-table-${className}-${i}`]['sort'] = j
                    dataTables[`data-table-${className}-${i}`]['sortOrder'] = 'asc'
                }
                createDataTable(className, i)
            }
            icons.appendChild(icon)
        }
    }
}

function paginateTables(className, index) {
    // TODO
}

function tableSummary(className, index) {
    // TODO
}

function removeHTML(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
}
