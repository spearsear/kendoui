#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
kendoui <- function(...,  type = 'undefined', width = NULL, height = NULL) {
  #params is a list of parameter pass to each kendoui widget
  #usage: kendoui(date_current='2015-12-18',date_input_id='calequota_selected_date',type = 'calendar')
  #usage: kendoui(orientation='vertical',min=-20,max=20,smallStep=2,largeStep=1,type = 'slider')

  params <- list(
    options = list(..., height=height, width=width),
    type = type,
    width = width,
    height = height
  )
  params <- Filter(Negate(is.null),params)

  # create widget using params
  htmlwidgets::createWidget(
    name = 'kendoui',
    params,
    width = width,
    height = height,
    sizingPolicy = htmlwidgets::sizingPolicy(viewer.padding=0,browser.fill=TRUE),
    package = 'kendoui')
}

#' Shiny bindings for kendoui
#'
#' Output and render functions for using kendoui within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a kendoui
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name kendoui-shiny
#'
#' @export
kendouiOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'kendoui', width, height, package = 'kendoui')
}

#' @rdname kendoui-shiny
#' @export
renderKendoui <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, kendouiOutput, env, quoted = TRUE)
}