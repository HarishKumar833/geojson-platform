FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN GDAL_PATH="$(find /usr -name 'libgdal.so' | head -n 1)" && \
    GEOS_PATH="$(find /usr -name 'libgeos_c.so' | head -n 1)" && \
    ln -sf "$GDAL_PATH" /usr/lib/libgdal.so && \
    ln -sf "$GEOS_PATH" /usr/lib/libgeos_c.so

ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/libgeos_c.so

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]