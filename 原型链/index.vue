<template>
    <div class="list-panel1" v-loading="loading">
        <Search
            :fields="fields"
            :headerType="30"
            :querying="querying"
            :formData="params"
            :filterNumber="8"
            :isShow="isShow"
            @query="search"
            @reset="resetForm"
            @refresh="refresh"
            @field="setSettings"
            @show="handleShowSearch"
        >
            <template #search>
                <el-form-item label size="small" class="tab-search__key">
                    <el-popover
                        placement="bottom"
                        width="240"
                        trigger="hover"
                        popper-class="search-popper"
                        :content="searchPlaceholder"
                    >
                        <el-input
                            v-model.trim="params.searchKey"
                            size="small"
                            slot="reference"
                            :placeholder="searchPlaceholder"
                            @clear="search"
                        >
                            <el-button
                                slot="append"
                                icon="iconfont icon-icon_chaxun"
                                @click="search"
                                :loading="querying"
                            ></el-button>
                        </el-input>
                    </el-popover>
                </el-form-item>
                <el-form-item label="订单类型" size="small" class="tab-search__common">
                    <el-select
                        placeholder="请选择"
                        v-model="params.orderType"
                        clearable
                        filterable
                        @change="search"
                    >
                        <el-option
                            v-for="(item, index) in enumSaleTypeList.arr"
                            :key="index"
                            :label="item.text"
                            :value="item.value"
                        ></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item size="small" label="客户" class="tab-search__common">
                    <el-input v-show="false" v-model="params.customerId"></el-input>
                    <ComMultipleSelectorCustomer
                        ref="multipleCustomer"
                        :value="params.customerName"
                        :customerRadio="params.customerId"
                        @change="customerChoice"
                        @clear="clearCustomer"
                    ></ComMultipleSelectorCustomer>
                </el-form-item>
                <el-form-item size="small" label="仓库" class="tab-search__common">
                    <el-select
                        ref="warehouse"
                        v-model="params.warehouseId"
                        placeholder="请选择"
                        :loading="warehouseLoading"
                        size="small"
                        @change="confirmStatementCallback"
                        clearable
                        multiple
                        collapse-tags
                        filterable
                    >
                        <el-option
                            v-for="(item, index) in warehouseArr"
                            :key="index"
                            :label="item.label"
                            :value="item.value"
                        ></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item size="small" label="开票情况" class="tab-search__common">
                    <el-select
                        v-model="params.makeOutType"
                        placeholder="请选择"
                        :loading="warehouseLoading"
                        size="small"
                        @change="changeInvoiceStatus"
                        clearable
                    >
                        <el-option
                            v-for="(item, index) in enumInvoiceStatus.arr"
                            :key="index"
                            :label="item.text"
                            :value="item.value"
                        ></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item size="small" label="集团客户" class="tab-search__common">
                    <el-input v-show="false" v-model="params.groupCustomerId"></el-input>
                    <el-row class="input-customer">
                        <selector-group-customer
                            :value="params.groupCustomerName"
                            :groupRadio="params.groupCustomerId"
                            @change="choiceGroup"
                            @clear="clearGroupCustomer"
                        ></selector-group-customer>
                    </el-row>
                </el-form-item>
                <el-form-item size="small" label="供应商" class="tab-search__common">
                    <el-input v-show="false" v-model="params.supplierIds"></el-input>
                    <ComMultipleSelectorSupplier
                        ref="multipleSupplier"
                        :value="params.supplierName"
                        :customerRadio="params.supplierIds"
                        @change="supplierChoice"
                    ></ComMultipleSelectorSupplier>
                </el-form-item>
                <el-form-item size="small" label="发货日期" class="tab-search__date">
                    <ComDateRange
                        @change="changeDeliveryDate"
                        :value="[params.shipStartTime, params.shipEndTime]"
                    ></ComDateRange>
                </el-form-item>
                <el-form-item size="small" label="数据类型" class="tab-search__common">
                    <el-select placeholder="请选择" v-model="params.dataType" @change="search">
                        <el-option
                            v-for="(item, index) in enumDataTypeList.arr"
                            :key="index"
                            :label="item.text"
                            :value="item.value"
                        ></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item size="small" label="产品名称" class="tab-search__common">
                    <el-input v-show="false" v-model="params.productId"></el-input>
                    <ComSelectorProduct
                        :value="params.productName"
                        @change="onProductChange"
                        @clear="onProductClear"
                        :customerId="false"
                    ></ComSelectorProduct>
                </el-form-item>
            </template>
            <template #button>
                <el-button
                    size="small"
                    @click="toggleSelectionChange"
                    type="primary"
                    :loading="querying"
                    :disabled="list.length === 0"
                >
                    {{ isSelectAll ? "取消" : "全选" }}
                </el-button>
                <el-button
                    size="small"
                    :plain="isMerge ? true : false"
                    @click="mergeDataClick"
                    :loading="querying"
                    :type="isMerge ? '' : 'primary'"
                    >{{ isMerge ? "展开数据" : "合并数据" }}
                </el-button>
                <el-button
                    size="small"
                    plain
                    @click="exportStatement"
                    v-if="iscomperhensiveExport"
                    :loading="querying"
                    :disabled="list.length == 0"
                    >导出Excel
                </el-button>
            </template>
        </Search>
        <div class="tab-amount">
            <div class="tab-amount-list">
                <div class="tab-amount-item">
                    <span class="tab-amount__label">发货数量(个)</span>
                    <span class="tab-amount__value">{{ reconciliation.shipQuantity || 0 }}</span>
                </div>
                <div class="tab-amount-item">
                    <span class="tab-amount__label">销售总额(元)</span>
                    <span class="tab-amount__value">{{ reconciliation.shipSalesAmount || 0 }}</span>
                </div>
                <div class="tab-amount-item">
                    <span class="tab-amount__label">采购总额(元)</span>
                    <span class="tab-amount__value">{{
                        reconciliation.shipPurchaseAmount || 0
                    }}</span>
                </div>
                <div class="tab-amount-item" v-if="isMerge">
                    <span class="tab-amount__label">含库存采购总额</span>
                    <span class="tab-amount__value">{{ reconciliation.totalPreCost || 0 }}</span>
                </div>
                <div class="tab-amount-item">
                    <span class="tab-amount__label">组装费用(元)</span>
                    <span class="tab-amount__value">{{
                        reconciliation.shipAssemblyAmount || 0
                    }}</span>
                </div>
                <div class="tab-amount-item">
                    <span class="tab-amount__label">毛利率</span>
                    <span class="tab-amount__value">{{ reconciliation.gross || 0 }}</span>
                </div>
            </div>
        </div>
        <el-checkbox-group
            class="tab-table list-customer"
            v-model="selectedStatementsIdList"
            v-loading.fullscreen.lock="exportLoading"
            element-loading-text="正在生成Excel中"
            @change="handleCheckGroupChange"
        >
            <el-table
                border
                stripe
                ref="table"
                style="width: 100%"
                header-row-class-name="header-row-class"
                :data="list"
                :max-height="tableHeight"
                :row-class-name="rowClassName"
                :highlight-current-row="true"
                :span-method="handleCellMerge"
                :cell-style="customCellStyle"
            >
                <template v-for="(field, colIndex) in fields">
                    <el-table-column
                        v-if="field.show"
                        :key="colIndex"
                        :fixed="
                            field.fixed ? (field.prop === 'operation' ? 'right' : 'left') : false
                        "
                        :prop="field.prop"
                        :show-overflow-tooltip="true"
                        :align="field.align"
                        :label="field.label"
                        :class-name="field.className"
                        :min-width="field.prop === 'productName' ? 210 : field.width || 120"
                    >
                        <template slot-scope="scope">
                            <template v-if="field.prop === 'selection'">
                                <el-checkbox
                                    :label="scope.row.id"
                                    :disabled="!isSalesPriceEdit"
                                    @change="handleCheckBoxChange($event, scope.row)"
                                    >&nbsp;</el-checkbox
                                >
                            </template>
                            <template v-else-if="isMerge && field.prop === 'productName'">
                                <span class="product-name">
                                    {{ scope.row[field.prop] }}
                                </span>
                                <span
                                    v-if="checkProductNameTag(scope.row)"
                                    class="product-name-tag"
                                    :class="checkProductNameTag(scope.row)"
                                >
                                    {{ enumProductNameTag.obj[scope.row["productType"]] }}
                                </span>
                            </template>
                            <template v-else-if="field.prop === 'orderType'">
                                {{ enumSaleTypeList.obj[scope.row[field.prop]] }}
                            </template>
                            <template v-else-if="field.prop === 'modifierTime'">
                                {{ scope.row["modifierTime"] }} {{ scope.row["modifierName"] }}
                            </template>
                            <template v-else-if="field.prop === 'orderCode'">
                                <span v-if="scope.row[field.prop]" class="d-flex f-row ai-center">
                                    <span :id="field.prop + scope.$index">
                                        {{ scope.row[field.prop] }}
                                    </span>
                                    <span v-if="scope.row['materialProductCount']">
                                        {{ `(${scope.row["materialProductCount"]})` }}
                                    </span>
                                    <i
                                        class="icon-copy c-pointer"
                                        @click="
                                            onCopy(scope.row[field.prop], field.prop + scope.$index)
                                        "
                                    ></i>
                                </span>
                                <span v-else>-</span>
                            </template>
                            <template v-else-if="field.prop === 'shipmentCode'">
                                <span v-if="scope.row[field.prop]" class="d-flex f-row ai-center">
                                    <span
                                        :id="field.prop + scope.$index"
                                        class="o-link el-button el-button--text"
                                        @click="$refs.receiptDetail.load(scope.row.shipmentOrderId)"
                                    >
                                        {{ scope.row[field.prop] }}
                                    </span>
                                    <i
                                        class="icon-copy c-pointer"
                                        @click="
                                            onCopy(scope.row[field.prop], field.prop + scope.$index)
                                        "
                                    ></i>
                                </span>
                                <span v-else>-</span>
                            </template>
                            <template v-else-if="field.prop === 'purchaseCode'">
                                <span v-if="scope.row[field.prop]" class="d-flex f-row ai-center">
                                    <span
                                        :id="field.prop + scope.$index"
                                        class="o-link el-button el-button--text"
                                        @click="
                                            $refs.productionDetails.load(scope.row.purchaseOrderId)
                                        "
                                    >
                                        {{ scope.row[field.prop] }}
                                    </span>
                                    <i
                                        class="icon-copy c-pointer"
                                        @click="
                                            onCopy(scope.row[field.prop], field.prop + scope.$index)
                                        "
                                    ></i>
                                </span>
                                <span v-else>-</span>
                            </template>
                            <template v-else-if="field.prop === 'fluteType'">
                                {{ enumFluteType.obj[scope.row[field.prop]] }}
                            </template>
                            <template v-else-if="field.prop === 'modificationTime'">
                                {{ scope.row["modificationTime"] }} {{ scope.row["modifierName"] }}
                            </template>
                            <template v-else-if="field.prop === 'reconciliationStatus'">
                                <template v-if="scope.row.reconciliationStatus === 1">
                                    <span
                                        class="o-link el-button el-button--text"
                                        @click="viewDetails(0, scope.row)"
                                    >
                                        {{
                                            enumStatementStatus.obj[scope.row.reconciliationStatus]
                                        }}
                                    </span>
                                </template>
                                <template v-else-if="scope.row.supplierReconciliationStatus === 1">
                                    <span
                                        class="o-link el-button el-button--text"
                                        @click="viewDetails(1, scope.row)"
                                    >
                                        {{
                                            enumStatementStatus.obj[
                                                scope.row.supplierReconciliationStatus
                                            ]
                                        }}
                                    </span>
                                </template>
                                <template v-else-if="scope.row.reconciliationStatus === 6">
                                    <span>
                                        {{
                                            enumStatementStatus.obj[scope.row.reconciliationStatus]
                                        }}
                                    </span>
                                </template>
                                <template v-else>
                                    <span
                                        class="o-link el-button el-button--text"
                                        @click="viewDetails(0, scope.row)"
                                    >
                                        {{
                                            enumStatementStatus.obj[scope.row.reconciliationStatus]
                                        }}
                                    </span>
                                    /
                                    <span
                                        class="o-link el-button el-button--text"
                                        @click="viewDetails(1, scope.row)"
                                    >
                                        {{
                                            enumStatementStatus.obj[
                                                scope.row.supplierReconciliationStatus
                                            ]
                                        }}
                                    </span>
                                </template>
                            </template>
                            <template v-else>{{ scope.row[field.prop] | nullValue }}</template>
                        </template>
                    </el-table-column>
                </template>
            </el-table>
        </el-checkbox-group>
        <div class="tab-pagination">
            <el-pagination
                background
                @size-change="changePageSize"
                @current-change="changeCurrentPage"
                :current-page="page.currentPage"
                :page-sizes="PAGE_SIZES"
                :page-size="page.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="page.totalCount"
            ></el-pagination>
        </div>
        <!--查看采购单详情 -->
        <DialogProductionDetails ref="productionDetails"></DialogProductionDetails>
        <!--查看送货单详情 -->
        <ReceiptDetail ref="receiptDetail"></ReceiptDetail>
        <!--查看对账单-->
        <DialogStatementDetail ref="statementDetail"></DialogStatementDetail>
        <!--查看调整单-->
        <DialogAdjustStatementDetail ref="adjustStatementDetail"></DialogAdjustStatementDetail>
        <dialog-download ref="download" :downloadHref="downloadHref"></dialog-download>
    </div>
</template>

<script>
    import listMixin from "@mixins/list.mixin";
    import permissionMixin from "@/mixins/permission.mixin";
    import permission from "@config/config.permission";
    import pageCacheMixin from "@/mixins/pageCache.mixin";
    // common
    import {
        enumDataTypeList,
        enumSigningStatus,
        enumFluteType,
        enumSaleTypeList,
        enumStatementStatus,
        enumInvoiceStatus,
        enumProductNameTag
    } from "@/common/enum";
    // config
    import { configFields } from "./config";
    // api
    import { getWarehouseListApi } from "@/api/order/index";
    import { getDownloadUrlApi, getDownloadHashApi } from "@/api/common/index";
    import {
        getAllStatementListApi,
        getAllReconciliationDataApi,
        getAllReconciliationDataMergeApi
    } from "@/api/finance/comprehensive-query";
    // components
    import Search from "@/components/search/index.vue";
    import DialogDownload from "./components/DialogDownload.vue";
    import ReceiptDetail from "@/views/order/components/DialogReceiptDetail";
    import SelectorGroupCustomer from "@/components/common/SelectorGroupCustomer.vue";
    import DialogProductionDetails from "@/views/order/components/DialogProductionDetails";
    import DialogStatementDetail from "../customer-statement/components/DialogStatementDetail"; //查看对账单
    import DialogAdjustStatementDetail from "../customer-statement/components/DialogAdjustStatementDetail"; //查看调整单
    // utils
    import { randomString } from "@utils/randomString";

    export default {
        name: "comprehensiveQuery",
        mixins: [listMixin, pageCacheMixin, permissionMixin],
        components: {
            Search,
            ReceiptDetail,
            DialogDownload,
            DialogStatementDetail,
            DialogProductionDetails,
            DialogAdjustStatementDetail,
            SelectorGroupCustomer
        },
        data() {
            return {
                searchPlaceholder: "订单号、采购单号、发货单号、客户品名、产品名称",
                isMerge: false,
                enumDataTypeList,
                enumSigningStatus,
                enumFluteType,
                enumSaleTypeList,
                enumStatementStatus,
                enumInvoiceStatus,
                enumProductNameTag,
                isShow: false,
                querying: false,
                isSelectAll: false,
                isSalesPriceEdit: true,
                warehouseLoading: false, // 仓库下拉加载中
                exportLoading: false, // 导出下拉加载中
                signingStatus: [{ value: "", text: "全部" }].concat(enumSigningStatus.arr),
                fileName: "综合查询列表", //导出文件名
                requestId: "", // 导出Excel hash
                downloadHref: "",
                selectedStatementsIdList: [], // 选中list
                selectedStatementsRowList: [], // 选中行数据
                preSelectedAllIdList: [], // 上一次选中list
                list: [],
                warehouseArr: [],
                page: {},
                params: {
                    dataType: "", // 数据类型
                    customerId: "", // 客户id
                    supplierIds: "", //供应商id
                    groupCustomerId: 0, // 集团id
                    customerName: "",
                    supplierName: "",
                    productName: "",
                    orderType: "",
                    warehouseId: [], // 仓库id
                    groupCustomerName: "", // 集团简称
                    makeOutType: "", //开票情况
                    searchKey: "", // 关键字
                    shipStartTime: "", // 签收开始时间
                    shipEndTime: "", //签收结束时间
                    productId: ""
                },
                fields: configFields(),
                reconciliation: {
                    shipSalesAmount: 0, //销售总额
                    shipPurchaseAmount: 0, //采购总额
                    shipQuantity: 0, //发货数量
                    shipAssemblyAmount: 0, // 组装费用
                    totalPreCost: 0 // 含库存采购总额
                },
                spanArr: [], // 存放表格合并数
                pos: 0 // 存放表格合并数索引
            };
        },
        computed: {
            iscomperhensiveExport() {
                return this.btnHasAuth(permission.FINANCE_COMPREHENSIVE_WAIT_STATEMENT_EXPORT);
            }
        },
        created() {
            this.params.customerName = this.$route.query.names
                ? this.$route.query.names
                : this.params.customerName;
            this.params.customerId = this.$route.query.ids
                ? this.$route.query.ids
                : this.params.customerId;
            this.params.supplierName = this.$route.query.names
                ? this.$route.query.names
                : this.params.supplierName;
            this.params.supplierName = this.$route.query.groupCustomerId
                ? this.$route.query.groupCustomerId
                : this.params.supplierName;
            this.params.warehouseId = this.$route.query.warehouseId
                ? this.$route.query.warehouseId
                : this.params.warehouseId;
            this.params.shipStartTime = this.$route.query.startTime
                ? this.$route.query.startTime
                : this.params.shipStartTime;
            this.params.shipEndTime = this.$route.query.endTime
                ? this.$route.query.endTime
                : this.params.shipEndTime;
            if (this.params.warehouseId && this.params.warehouseId.length) {
                this.getCustomersWarehouseList(this.params.customerId);
            }
        },
        methods: {
            // 自定义单元格样式
            customCellStyle({ row, column, rowIndex, columnIndex }) {
                if (this.isMerge) {
                    const checkArr = ["orderCode", "selection", "gross"];
                    if (row.productType === 2 && !checkArr.includes(column.property)) {
                        return {
                            backgroundColor: "rgba(0, 212, 138, 0.1)"
                        };
                    }
                    if (column.property === "orderCode") {
                        return {
                            backgroundColor: "#f6f7fc!important"
                        };
                    } else if (column.property === "selection" || column.property === "gross") {
                        return {
                            backgroundColor: "#fff!important"
                        };
                    }
                }
            },
            // 处理表格产品名称显示标识
            checkProductNameTag(row) {
                let arr = [2, 3];
                if (!arr.includes(row["productType"])) return false;
                if (row["productType"] === 2) return "green";
                if (row["productType"] === 3) return "yellow";
            },
            // 记录需要合并的单元格
            getSpanArr(data) {
                for (let i = 0; i < data.length; i++) {
                    if (i === 0) {
                        this.spanArr.push(1);
                        this.pos = 0;
                    } else {
                        // 判断当前元素与上一个元素是否相同
                        if (data[i].mergeFlag === data[i - 1].mergeFlag) {
                            this.spanArr[this.pos] += 1;
                            this.spanArr.push(0);
                        } else {
                            this.spanArr.push(1);
                            this.pos = i;
                        }
                    }
                }
            },
            // 合并数据表格合并行列
            handleCellMerge({ row, column, rowIndex, columnIndex }) {
                if (!this.isMerge) return;
                if (
                    column.property === "orderCode" ||
                    column.property === "selection" ||
                    column.property === "gross"
                ) {
                    const _row = this.spanArr[rowIndex];
                    const _col = _row > 0 ? 1 : 0;
                    return {
                        rowspan: _row,
                        colspan: _col
                    };
                }
            },
            // 设置表格颜色
            rowClassName({ row }) {
                let className = "";
                if (row.reconciliationStatus == 6) {
                    className = "row-orange";
                }
                return className;
            },
            //查看对账单
            viewDetails(userType, row) {
                if (userType === 0) {
                    if (row.reconciliationStatus === 1) {
                        this.$refs.adjustStatementDetail.load(userType, row.id);
                    } else {
                        this.$refs.statementDetail.load(userType, row.id);
                    }
                } else {
                    if (row.supplierReconciliationStatus === 1) {
                        this.$refs.adjustStatementDetail.load(userType, row.id);
                    } else {
                        this.$refs.statementDetail.load(userType, row.id);
                    }
                }
            },
            // 供应商选中回调
            supplierChoice(row, name) {
                row = row || [];
                this.params.supplierIds = row.toString();
                this.params.supplierName = name;
                this.params.currentPage = 1;
                this.query();
            },
            // 选中客户回调
            choiceGroup(row) {
                this.params.groupCustomerId = row.id || 0;
                this.params.groupCustomerName = row.shortName;
                this.params.currentPage = 1;
                this.query();
            },
            // 清空所属集团输入框
            clearGroupCustomer() {
                this.params.groupCustomerId = 0;
                this.params.groupCustomerName = "";
            },
            //选择开票情况
            changeInvoiceStatus() {
                this.params.currentPage = 1;
                this.query();
            },
            // 时间选择
            changeDeliveryDate(date) {
                if (date) {
                    this.params.shipStartTime = date[0];
                    this.params.shipEndTime = date[1];
                    this.params.currentPage = 1;
                } else {
                    this.params.shipStartTime = "";
                    this.params.shipEndTime = "";
                    this.params.currentPage = 1;
                }
                this.query();
            },
            // 单选前端计算
            handleCheckBoxChange(e, row) {
                if (e) {
                    if (this.isMerge) {
                        this.list.forEach(item => {
                            if (item.mergeFlag === row.mergeFlag) {
                                this.selectedStatementsRowList.push(item);
                            }
                        });
                    } else {
                        this.selectedStatementsRowList.push(row);
                    }
                } else {
                    if (this.isMerge) {
                        this.selectedStatementsRowList = this.selectedStatementsRowList.filter(
                            el => el.mergeFlag !== row.mergeFlag
                        );
                    } else {
                        let index = this.selectedStatementsRowList.findIndex(
                            el => el.id === row.id
                        );
                        this.selectedStatementsRowList.splice(index, 1);
                    }
                }
            },
            handleCheckGroupChange(value) {
                // 根据是否全选调用接口
                if (this.isSelectAll) {
                    this.handleSelectionAllChange(value);
                } else {
                    this.handleSelectionChange();
                }
            },
            // 毛利率=（销售总额 － 采购总额－ 组装费用）/  销售总额 reconciliation.gross
            // 全选触发事件
            handleSelectionChange() {
                let gross = 0;
                let shipSalesAmount = 0;
                let shipPurchaseAmount = 0;
                let shipAssemblyAmount = 0;
                let prePurchaseCost = 0;
                let shipQuantity = 0; // 发货数量 = 实际发货数量累加
                this.selectedStatementsRowList.forEach(item => {
                    if (this.isMerge && (item.productType == 1 || item.productType == 2)) {
                        shipQuantity += item.shipQuantity || 0; // 发货数量 += 实际发货数据
                    } else if (!this.isMerge) {
                        shipQuantity += item.shipQuantity || 0; // 发货数量 += 实际发货数据
                    }
                    prePurchaseCost += item.prePurchaseCost || 0;
                    shipSalesAmount += item.shipSalesAmount || 0; // 销售总额 += 已发货销售总额
                    shipPurchaseAmount += item.shipPurchaseAmount || 0; // 采购总额 += 已发货采购总额
                    shipAssemblyAmount += item.shipAssemblyAmount || 0; // 组装费用 += 已发货组装总额
                });
                this.reconciliation.shipQuantity =
                    (shipQuantity && Number(shipQuantity.toFixed(4))) || 0;
                this.reconciliation.totalPreCost =
                    (prePurchaseCost &&
                        Number((prePurchaseCost + shipPurchaseAmount).toFixed(4))) ||
                    0;
                this.reconciliation.shipAssemblyAmount =
                    (shipAssemblyAmount && Number(shipAssemblyAmount.toFixed(4))) || 0;
                this.reconciliation.shipSalesAmount =
                    (shipSalesAmount && Number(shipSalesAmount.toFixed(4))) || 0;
                this.reconciliation.shipPurchaseAmount =
                    (shipPurchaseAmount && Number(shipPurchaseAmount.toFixed(4))) || 0;
                if (shipSalesAmount == 0) {
                    gross = 0;
                } else {
                    gross =
                        ((shipSalesAmount - shipPurchaseAmount - shipAssemblyAmount) /
                            shipSalesAmount) *
                        100;
                }
                this.reconciliation.gross = (gross && gross.toFixed(4) + "%") || 0;
            },
            // 全选后单选
            handleSelectionAllChange(value) {
                const isPlus = value.length > this.preSelectedAllIdList.length;
                const id = isPlus
                    ? value.find(item => !this.preSelectedAllIdList.includes(item))
                    : this.preSelectedAllIdList.find(item => !value.includes(item));
                const selectedItem = this.list.find(item => item.id === id);
                let shipQuantity = 0,
                    shipSalesAmount = 0,
                    shipPurchaseAmount = 0,
                    totalPreCost = 0,
                    shipAssemblyAmount = 0;

                if (this.isMerge) {
                    if (isPlus) {
                        this.list.forEach(item => {
                            if (item.mergeFlag === selectedItem.mergeFlag) {
                                if (item.productType == 1 || item.productType == 2) {
                                    shipQuantity += item.shipQuantity || 0;
                                }
                                totalPreCost += item.prePurchaseCost || 0;
                                shipSalesAmount += item.shipSalesAmount || 0;
                                shipPurchaseAmount += item.shipPurchaseAmount || 0;
                                shipAssemblyAmount += item.shipAssemblyAmount || 0;
                            }
                        });
                    } else {
                        this.list.forEach(item => {
                            if (item.mergeFlag === selectedItem.mergeFlag) {
                                if (item.productType == 1 || item.productType == 2) {
                                    shipQuantity -= item.shipQuantity || 0;
                                }
                                totalPreCost -= item.prePurchaseCost || 0;
                                shipSalesAmount -= item.shipSalesAmount || 0;
                                shipPurchaseAmount -= item.shipPurchaseAmount || 0;
                                shipAssemblyAmount -= item.shipAssemblyAmount || 0;
                            }
                        });
                    }
                } else {
                    if (isPlus) {
                        shipQuantity += selectedItem.shipQuantity || 0;
                        shipSalesAmount += selectedItem.shipSalesAmount || 0;
                        shipPurchaseAmount += selectedItem.shipPurchaseAmount || 0;
                        shipAssemblyAmount += selectedItem.shipAssemblyAmount || 0;
                    } else {
                        shipQuantity -= selectedItem.shipQuantity || 0;
                        shipSalesAmount -= selectedItem.shipSalesAmount || 0;
                        shipPurchaseAmount -= selectedItem.shipPurchaseAmount || 0;
                        shipAssemblyAmount -= selectedItem.shipAssemblyAmount || 0;
                    }
                }

                this.reconciliation.shipQuantity = this.reconciliation.shipQuantity
                    ? this.reconciliation.shipQuantity + shipQuantity
                    : shipQuantity;
                this.reconciliation.shipSalesAmount = this.reconciliation.shipSalesAmount
                    ? this.reconciliation.shipSalesAmount + shipSalesAmount
                    : shipSalesAmount;
                this.reconciliation.shipPurchaseAmount = this.reconciliation.shipPurchaseAmount
                    ? this.reconciliation.shipPurchaseAmount + shipPurchaseAmount
                    : shipPurchaseAmount;
                this.reconciliation.shipAssemblyAmount = this.reconciliation.shipAssemblyAmount
                    ? this.reconciliation.shipAssemblyAmount + shipAssemblyAmount
                    : shipAssemblyAmount;
                this.reconciliation.totalPreCost = this.reconciliation.totalPreCost
                    ? this.reconciliation.totalPreCost + totalPreCost + shipPurchaseAmount
                    : totalPreCost + shipPurchaseAmount;

                this.reconciliation.shipQuantity =
                    (this.reconciliation.shipQuantity &&
                        Number(this.reconciliation.shipQuantity.toFixed(4))) ||
                    0;
                this.reconciliation.shipSalesAmount =
                    (this.reconciliation.shipSalesAmount &&
                        Number(this.reconciliation.shipSalesAmount.toFixed(4))) ||
                    0;
                this.reconciliation.shipPurchaseAmount =
                    (this.reconciliation.shipPurchaseAmount &&
                        Number(this.reconciliation.shipPurchaseAmount.toFixed(4))) ||
                    0;
                this.reconciliation.shipAssemblyAmount =
                    (this.reconciliation.shipAssemblyAmount &&
                        Number(this.reconciliation.shipAssemblyAmount.toFixed(4))) ||
                    0;
                this.reconciliation.totalPreCost =
                    (this.reconciliation.totalPreCost &&
                        Number(this.reconciliation.totalPreCost.toFixed(4))) ||
                    0;

                if (this.reconciliation.shipSalesAmount == 0) {
                    this.reconciliation.gross = 0;
                } else {
                    this.reconciliation.gross =
                        (
                            ((this.reconciliation.shipSalesAmount -
                                this.reconciliation.shipPurchaseAmount -
                                this.reconciliation.shipAssemblyAmount) /
                                this.reconciliation.shipSalesAmount) *
                            100
                        ).toFixed(4) + "%";
                }
                this.preSelectedAllIdList = [...value];
                if (this.selectedStatementsIdList.length === 0) {
                    this.reconciliation = {
                        shipSalesAmount: 0, //销售总额
                        shipPurchaseAmount: 0, //采购总额
                        gross: 0, //毛利率
                        shipQuantity: 0, //发货数量
                        totalPreCost: 0
                    };
                }
            },
            //导出
            exportStatement() {
                this.trackData(386);
                const {
                    dataType = "", // 数据类型
                    customerId, // 客户id
                    supplierIds, //供应商id
                    groupCustomerId, // 集团id
                    customerName = "",
                    supplierName = "",
                    orderType = "",
                    warehouseId = [], // 仓库id
                    makeOutType = "", //开票情况
                    searchKey = "", // 关键字
                    shipStartTime = "", // 签收开始时间
                    shipEndTime = "", //签收结束时间
                    productId
                } = this.params;

                let params = {
                    dataType,
                    orderType,
                    searchKey,
                    shipEndTime,
                    makeOutType,
                    customerName,
                    supplierName,
                    shipStartTime,
                    customerId: customerId || "",
                    supplierIds: supplierIds || "",
                    groupCustomerId: groupCustomerId || "",
                    warehouseId: warehouseId.join(",") || "",
                    productId
                };
                //合并展开数据导出地址
                const url = this.isMerge
                    ? "transaction_record/export_comprehensive_inquiry_merge"
                    : "transaction_record/export_comprehensive_inquiry_detail";

                let formData = {
                    method: "post",
                    params,
                    url
                };
                this.exportLoading = true;
                if (this.isMerge) {
                    formData.fileName = this.fileName;
                    this.downloadExcelApi(formData, () => {
                        this.$message.success("导出成功");
                        this.exportLoading = false;
                    });
                } else {
                    this.getDownloadHash(params, formData);
                }
            },
            // 全选
            toggleSelectionChange() {
                this.isSelectAll = !this.isSelectAll;
                this.list.forEach(item => {
                    this.$refs.table.toggleRowSelection(item, this.isSelectAll);
                });
                if (this.isSelectAll) {
                    this.setStatementReconciliation("");
                } else {
                    this.emptyalesPriceAndSelectedStatementsId();
                }
            },
            // 获取对账详情
            setStatementReconciliation(ids) {
                this.loading = true;
                let formData = {
                    productId: this.params.productId ? this.params.productId : "",
                    customerId: this.params.customerId ? this.params.customerId : "", // 客户id
                    supplierIds: this.params.supplierIds ? this.params.supplierIds : "", // 客户id
                    groupCustomerId: this.params.groupCustomerId ? this.params.groupCustomerId : "",
                    shipStartTime: this.params.shipStartTime,
                    shipEndTime: this.params.shipEndTime,
                    searchKey: this.params.searchKey, // 关键字
                    warehouseId: this.params.warehouseId.join(","), // 仓库id
                    dataType: this.params.dataType,
                    ids: ids
                };
                if (this.isMerge) {
                    this.getAllReconciliationDataMergeApi(formData);
                } else {
                    this.getAllReconciliationDataApi(formData);
                }
            },
            confirmStatementCallback(bool = true) {
                this.emptyalesPriceAndSelectedStatementsId();
                this.isSalesPriceEdit = true; // 取消对账单价可修改
                if (bool) {
                    this.params.searchKey = "";
                    this.search();
                } else {
                    this.query();
                }
            },
            // 清空全选和对账数据
            emptyalesPriceAndSelectedStatementsId() {
                this.selectedStatementsIdList = [];
                this.selectedStatementsRowList = [];
                this.isSelectAll = false;
                this.reconciliation = {
                    shipSalesAmount: 0, //销售总额
                    shipPurchaseAmount: 0, //采购总额
                    shipQuantity: 0, //发货数量
                    gross: 0, //毛利率
                    shipAssemblyAmount: 0, // 组装费用
                    totalPreCost: 0
                };
            },
            // 产品名称回调
            onProductChange(row) {
                console.log(row, "row");
                this.params.productId = row.id;
                this.params.productName = row.name;
                this.search();
            },
            onProductClear() {
                this.params.productId = "";
                this.params.productName = "";
                this.search();
            },
            clearCustomer() {
                this.params.customerId = "";
                this.warehouseArr = [];
                this.search();
            },
            // 客户选中回调
            customerChoice(row, name) {
                row = row || [];
                this.params.customerId = row.toString();
                this.params.customerName = name;
                this.warehouseArr = [];
                this.params.warehouseId = [];
                this.params.currentPage = 1;
                this.getCustomersWarehouseList(this.params.customerId || "");
                this.search();
            },
            search() {
                this.params.currentPage = 1;
                this.query();
            },
            refresh() {
                this.params.currentPage = 1;
                this.query(this.isMerge ? "merge" : undefined);
            },
            mergeDataClick() {
                // eslint-disable-next-line no-unused-expressions
                this.isMerge ? this.trackData(388) : this.trackData(387);
                this.isMerge = !this.isMerge;
                this.searchPlaceholder = this.isMerge
                    ? "(成品订单查询)订单号、采购单号、发货单号、客户品名、产品名称"
                    : "订单号、采购单号、发货单号、客户品名、产品名称";
                this.query();
            },
            query() {
                this.querying = true;
                this.loading = true;
                const {
                    customerId,
                    supplierIds,
                    productId,
                    warehouseId,
                    groupCustomerId,
                    searchKey,
                    dataType,
                    shipStartTime,
                    shipEndTime,
                    makeOutType,
                    orderType,
                    pageSize = this.PAGE_SIZES[0],
                    currentPage = 1
                } = this.params;
                let formData = {
                    customerId, // 客户id
                    supplierIds, //供应商id
                    productId,
                    warehouseId: warehouseId.join(","), // 仓库id
                    groupCustomerId: groupCustomerId || "",
                    searchKey, // 关键字
                    shipStartTime, // 签收开始时间
                    shipEndTime, //签收结束时间
                    makeOutType, //开票情况
                    orderType,
                    pageSize,
                    currentPage,
                    dataType
                };
                this.getAllStatementListApi(
                    formData,
                    this.isMerge,
                    this.isMerge ? "merge" : undefined
                );
            },
            mergeDataHandle(type) {
                if (type == "merge") {
                    this.isMerge = true;
                } else {
                    this.isMerge = false;
                }
            },
            resetForm() {
                this.isMerge = false;
                if (this.params.customerId) {
                    this.$refs.multipleCustomer.clearInput();
                }
                if (this.params.supplierIds) {
                    this.$refs.multipleSupplier.clearInput();
                }
                this.params.customerName = "";
                this.params = {
                    customerId: "", // 客户id
                    supplierIds: "", //供应商id
                    groupCustomerId: 0, // 集团id
                    productId: "",
                    productName: "",
                    customerName: "",
                    supplierName: "",
                    warehouseId: [], // 仓库id
                    makeOutType: "", //开票情况
                    searchKey: "", // 关键字
                    orderType: "",
                    shipStartTime: "", // 签收开始时间
                    shipEndTime: "" //签收结束时间
                };
                this.params.groupCustomerName = "";
                this.warehouseArr = [];
                this.resetReconciliation();
                this.search();
            },
            resetReconciliation() {
                this.isSelectAll = false;
                this.reconciliation.shipSalesAmount = 0;
                this.reconciliation.shipPurchaseAmount = 0;
                this.reconciliation.shipQuantity = 0;
                this.reconciliation.shipAssemblyAmount = 0;
                this.reconciliation.gross = 0;
                this.reconciliation.totalPreCost = 0;
                this.selectedStatementsIdList = [];
                this.selectedStatementsRowList = [];
            },
            async getAllStatementListApi(params, isMerge, type) {
                const result = await getAllStatementListApi(params, isMerge);
                if (result && result.resultData) {
                    this.getTableHeight();
                    this.setFields(result.resultData.fields);
                    if (isMerge) {
                        // 表格合并数据处理
                        let list = [];
                        result.resultData.list.forEach(item => {
                            // 给每一组数据添加标识
                            let flag = randomString(16, 32).toLowerCase();
                            list.push(
                                ...item.transactionRecordVOList.map(subItem => {
                                    if (subItem.productType == 2) {
                                        return {
                                            ...subItem,
                                            mergeFlag: flag,
                                            materialProductCount: item.materialProductCount
                                        };
                                    }
                                    return { ...subItem, mergeFlag: flag };
                                })
                            );
                        });
                        // 记录需要合并的行
                        this.spanArr = [];
                        this.getSpanArr(list);

                        this.list = list || [];
                    } else {
                        this.list = result.resultData.list || [];
                    }
                    if (this.list.length > 0) {
                        this.list.forEach(item => {
                            if (Array.isArray(item.customerBillDate)) {
                                let customerBillDate = [];
                                item.customerBillDate.map(customerBill => {
                                    if (customerBill) {
                                        customerBillDate.push(customerBill);
                                    }
                                    return customerBillDate;
                                });
                                item.customerBillDate = customerBillDate.join(",");
                            }
                            if (Array.isArray(item.supplierBillDate)) {
                                let supplierBillDate = [];
                                item.supplierBillDate.map(supplierBill => {
                                    if (supplierBill) {
                                        supplierBillDate.push(supplierBill);
                                    }
                                    return supplierBillDate;
                                });
                                item.supplierBillDate = supplierBillDate.join(",");
                            }
                        });
                    }
                    this.page = result.resultData.page;
                    this.loading = false;
                    this.querying = false;
                    this.mergeDataHandle(type);
                } else {
                    this.loading = false;
                    this.querying = false;
                    this.list = [];
                    this.mergeDataHandle(type);
                }
            },
            async getAllReconciliationDataApi(params) {
                const result = await getAllReconciliationDataApi(params);
                if (result && result.resultData) {
                    this.reconciliation = {
                        shipSalesAmount: result.resultData.shipSalesAmount, //销售总额
                        shipPurchaseAmount: result.resultData.shipPurchaseAmount, //采购总额
                        shipAssemblyAmount: result.resultData.shipAssemblyAmount, // 组装费用
                        shipQuantity: result.resultData.shipQuantity, //发货数量
                        gross: (result.resultData.gross * 100).toFixed(4) + "%" //毛利率
                    };
                    this.loading = false;
                    this.selectedStatementsIdList = result.resultData.ids || [];
                    this.preSelectedAllIdList = result.resultData.ids || [];
                } else {
                    this.loading = false;
                }
            },
            async getAllReconciliationDataMergeApi(params) {
                const result = await getAllReconciliationDataMergeApi(params);
                if (result && result.resultData) {
                    this.reconciliation = {
                        shipSalesAmount: result.resultData.shipSalesAmount, //销售总额
                        shipPurchaseAmount: result.resultData.shipPurchaseAmount, //采购总额
                        shipAssemblyAmount: result.resultData.shipAssemblyAmount, // 组装费用
                        shipQuantity: result.resultData.shipQuantity, //发货数量
                        gross: (result.resultData.gross * 100).toFixed(4) + "%", //毛利率
                        totalPreCost: result.resultData.totalPreCost
                    };
                    this.loading = false;
                    this.selectedStatementsIdList = result.resultData.ids || [];
                    this.preSelectedAllIdList = result.resultData.ids || [];
                } else {
                    this.loading = false;
                }
            },
            // 获取仓库数据
            async getCustomersWarehouseList(id) {
                if (!id) {
                    return;
                }
                try {
                    this.querying = true;
                    this.warehouseLoading = true;
                    const result = await getWarehouseListApi({ customerIds: id });
                    let warehouseArr = [];
                    if (result && result.resultData) {
                        let list = result.resultData;
                        list.forEach(item => {
                            warehouseArr.push({
                                value: item.id,
                                label: item.name
                            });
                        });
                    }
                    this.warehouseArr = warehouseArr;
                    this.warehouseLoading = false;
                    this.querying = false;
                } catch (error) {
                    this.$message.error(error.resultMsg || this.MSG_UNKNOWN);
                    this.warehouseLoading = false;
                    this.querying = false;
                }
            },
            async getDownloadHash(params, options) {
                const result = await getDownloadHashApi(params, options, this);
                if (result && result.resultData) {
                    this.requestId = result.resultData;
                    this.$setInterval(60, 1000, this.getDownloadUrl, this.loadingCallback);
                } else {
                    this.$message.error("导出失败!");
                    this.exportLoading = false;
                }
            },
            async getDownloadUrl() {
                const result = await getDownloadUrlApi(this.requestId);
                if (result && result.resultData) {
                    this.downloadHref = result.resultData;
                    this.$message.success("导出成功, 请点击下载!");
                    this.$refs.download.onLoad();
                    return true;
                } else {
                    return false;
                }
            },
            loadingCallback() {
                this.exportLoading = false;
            }
        }
    };
</script>
<style scoped lang="less">
    .list-panel1 {
        padding-right: 8px;
        flex-direction: column;
    }
    .list-customer {
        /deep/ .customer-edition {
            .el-input__inner {
                font-size: 14px;
                text-align: center;
                background: #ffffff;
            }
            .is-disabled {
                .el-input__inner {
                    border: 0;
                    color: #666666;
                    background: none;
                    cursor: auto;
                    &:visited,
                    &:link,
                    &:active,
                    &:hover {
                        background: none;
                        cursor: auto;
                    }
                }
            }
        }
        /deep/ .el-checkbox__label {
            display: none;
        }
    }
    .el-table .t-date .cell {
        white-space: pre-line;
    }
    /deep/.row-orange {
        color: orange;
    }
    .tab-amount-item {
        width: 200px;
    }
    /deep/.tab-search__key {
        .search-popper {
            top: 165px !important;
        }
    }
    .product-name {
        width: 136px;
        display: inline-block;
        vertical-align: middle;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        -o-text-overflow: ellipsis;
    }
    .product-name-tag {
        color: #fff;
        font-size: 12px;
        border-radius: 2px;
        height: 16px;
        line-height: 16px;
        padding: 0 2px;
        text-align: center;
        display: inline-block;
        vertical-align: middle;
        &.yellow {
            background-color: #ff9a38;
        }
        &.green {
            background-color: #00d48a;
        }
    }
</style>
