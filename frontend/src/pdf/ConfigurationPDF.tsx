import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import type {
  PriceResponse,
  ProductConfiguration,
} from "../types/configurator";

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles =
  StyleSheet.create({
    page: {
      padding: 36,

      fontSize: 11,
    },

    title: {
      fontSize: 22,

      marginBottom: 16,
    },

    row: {
      marginBottom: 8,
    },

    box: {
      padding: 10,

      border:
        "1 solid #ddd",

      marginTop: 12,
    },

    preview: {
      width: 480,

      height: 312,

      objectFit: "contain",

      marginTop: 12,
    },

    sectionTitle: {
      marginTop: 18,

      fontSize: 15,
    },
  });

/* -------------------------------------------------------------------------- */
/* PROPS                                                                      */
/* -------------------------------------------------------------------------- */

interface ConfigurationPDFProps {
  config: ProductConfiguration;

  price: PriceResponse;

  preview: string;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function ConfigurationPDF({
  config,
  price,
  preview,
}: ConfigurationPDFProps) {
  const count =
    Object.values(
      config.sections,
    ).reduce(
      (
        total,
        section,
      ) =>
        total +
        section.elements
          .length,
      0,
    );

  return (
    <Document>
      <Page
        size="A4"
        style={styles.page}
      >
        {/* -------------------------------------------------------------- */}
        {/* TITLE                                                          */}
        {/* -------------------------------------------------------------- */}

        <Text
          style={styles.title}
        >
          Custom Tent
          Configuration
        </Text>

        {/* -------------------------------------------------------------- */}
        {/* CONFIGURATION DETAILS                                         */}
        {/* -------------------------------------------------------------- */}

        <View
          style={styles.box}
        >
          <Text
            style={styles.row}
          >
            Product: 10x10
            Logo Canopy Tent
          </Text>

          <Text
            style={styles.row}
          >
            Configuration ID:{" "}
            {config.id}
          </Text>

          <Text
            style={styles.row}
          >
            Size:{" "}
            {config.size}
          </Text>

          <Text
            style={styles.row}
          >
            Canopy:{" "}
            {config.canopyColor}
          </Text>

          <Text
            style={styles.row}
          >
            Frame:{" "}
            {config.frameColor}
          </Text>

          <Text
            style={styles.row}
          >
            Custom elements:{" "}
            {count}
          </Text>

          <Text
            style={styles.row}
          >
            Base: $
            {price.basePrice}
          </Text>

          <Text
            style={styles.row}
          >
            Variant: $
            {price.variantPrice}
          </Text>

          <Text
            style={styles.row}
          >
            Customization: $
            {price.customizationPrice}
          </Text>

          <Text
            style={styles.row}
          >
            Total: $
            {price.total}
          </Text>
        </View>

        {/* -------------------------------------------------------------- */}
        {/* 2D PREVIEW                                                     */}
        {/* -------------------------------------------------------------- */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          2D Design Preview
        </Text>

        {preview ? (
          <Image
            src={preview}
            style={
              styles.preview
            }
          />
        ) : (
          <Text>
            No preview available.
          </Text>
        )}

        {/* -------------------------------------------------------------- */}
        {/* GENERATED DATE                                                 */}
        {/* -------------------------------------------------------------- */}

        <Text
          style={{
            marginTop: 20,
          }}
        >
          Generated:{" "}
          {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
}