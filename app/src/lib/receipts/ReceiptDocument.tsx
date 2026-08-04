import {Document, Page, Text, View, StyleSheet, Font} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica-Bold",
  fonts: [{src: "Helvetica-Bold"}],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#102015",
  },
  watermark: {
    position: "absolute",
    top: 280,
    left: 60,
    fontSize: 90,
    color: "#1f7a3f",
    opacity: 0.06,
    transform: "rotate(-30deg)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2 solid #1f7a3f",
    paddingBottom: 16,
    marginBottom: 20,
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1f7a3f",
  },
  brandSub: {
    fontSize: 9,
    color: "#587063",
    marginTop: 4,
  },
  receiptTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  receiptCode: {
    fontSize: 10,
    color: "#587063",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#8a7d55",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  col: {
    width: "48%",
  },
  table: {
    marginTop: 8,
    border: "1 solid #e2e8e4",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f8ef",
    borderBottom: "1 solid #e2e8e4",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8e4",
    padding: 6,
  },
  colName: {width: "40%"},
  colQty: {width: "15%", textAlign: "right"},
  colPrice: {width: "20%", textAlign: "right"},
  colTotal: {width: "25%", textAlign: "right"},
  totalsBlock: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginBottom: 3,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1 solid #102015",
  },
  grandTotalLabel: {fontFamily: "Helvetica-Bold", fontSize: 12},
  grandTotalValue: {fontFamily: "Helvetica-Bold", fontSize: 12},
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#8a9b91",
    textAlign: "center",
    borderTop: "1 solid #e2e8e4",
    paddingTop: 10,
  },
});

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function date(input: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(input);
}

export type ReceiptPdfInput = {
  code: string;
  issuedAt: Date;
  amount: number;
  status: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerAddress: string | null;
  order: {
    code: string;
    deliveryMethod: string;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discountAmount: number;
    totalAmount: number;
    items: Array<{name: string; grade: string; quantity: number; unit: string; unitPrice: number; lineTotal: number}>;
  };
};

export default function ReceiptDocument({receipt}: {receipt: ReceiptPdfInput}) {
  return (
    <Document title={`OneFarmTech Receipt ${receipt.code}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>ONEFARMTECH</Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>OneFarmTech</Text>
            <Text style={styles.brandSub}>ONEFARM-TECH LTD · RC - 1714625</Text>
            <Text style={styles.brandSub}>Suite 7, Cherry Hill Plaza, FCT, Abuja 900108, Nigeria</Text>
          </View>
          <View>
            <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptCode}>{receipt.code}</Text>
            <Text style={styles.receiptCode}>{date(receipt.issuedAt)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text>{receipt.buyerName}</Text>
            {receipt.buyerAddress ? <Text>{receipt.buyerAddress}</Text> : null}
            {receipt.buyerEmail ? <Text>{receipt.buyerEmail}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Order</Text>
            <Text>Order: {receipt.order.code}</Text>
            <Text>Delivery: {receipt.order.deliveryMethod}</Text>
            <Text>Status: {receipt.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colName}>Product</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colPrice}>Unit price</Text>
              <Text style={styles.colTotal}>Line total</Text>
            </View>
            {receipt.order.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.colName}>{item.name}{item.grade ? ` (${item.grade})` : ""}</Text>
                <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.colPrice}>{money(item.unitPrice)}</Text>
                <Text style={styles.colTotal}>{money(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(receipt.order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Delivery fee</Text>
            <Text>{money(receipt.order.deliveryFee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Service fee</Text>
            <Text>{money(receipt.order.serviceFee)}</Text>
          </View>
          {receipt.order.discountAmount ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{money(receipt.order.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Amount paid</Text>
            <Text style={styles.grandTotalValue}>{money(receipt.amount)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This receipt was issued electronically by OneFarmTech and is valid without a signature.</Text>
          <Text>Questions about this receipt? Contact OneFarmTech support via WhatsApp or onefarmtech.com/contact</Text>
        </View>
      </Page>
    </Document>
  );
}
