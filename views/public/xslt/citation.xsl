<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" indent="yes" />
	<xsl:template match="title">
		<em>
			<xsl:apply-templates />
		</em>
	</xsl:template>
	<xsl:template match="year">
		<span class="">
			<xsl:apply-templates />
		</span>
	</xsl:template>
</xsl:stylesheet>
